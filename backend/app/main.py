from __future__ import annotations

import base64
import csv
import hashlib
import hmac
import io
import json
import os
import secrets
import time
from datetime import UTC, datetime, timedelta
from enum import StrEnum
from typing import Any, Callable

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    create_engine,
    func,
    select,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


class Base(DeclarativeBase):
    pass


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)

role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True),
)


class DispatchStatus(StrEnum):
    SCHEDULED = "Scheduled"
    LOADING = "Loading"
    DELAYED = "Delayed"
    COMPLETED = "Completed"


class CustomerRisk(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Dispatch(Base):
    __tablename__ = "dispatches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    customer: Mapped[str] = mapped_column(String(120), index=True)
    pickup: Mapped[str] = mapped_column(String(160))
    dropoff: Mapped[str] = mapped_column(String(160))
    vehicle: Mapped[str] = mapped_column(String(64))
    planner: Mapped[str] = mapped_column(String(64))
    window: Mapped[str] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(32), default=DispatchStatus.SCHEDULED.value)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    tier: Mapped[str] = mapped_column(String(32))
    lanes: Mapped[int] = mapped_column(Integer, default=0)
    monthly_spend: Mapped[float] = mapped_column(Float, default=0.0)
    sla: Mapped[float] = mapped_column(Float, default=95.0)
    owner: Mapped[str] = mapped_column(String(64))
    risk: Mapped[str] = mapped_column(String(16), default=CustomerRisk.LOW.value)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class ActionLog(Base):
    __tablename__ = "action_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    action: Mapped[str] = mapped_column(String(120), index=True)
    details: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(256))
    status: Mapped[str] = mapped_column(String(24), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    roles: Mapped[list[Role]] = relationship("Role", secondary=user_roles, back_populates="users")


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(240), default="")

    users: Mapped[list[User]] = relationship(User, secondary=user_roles, back_populates="roles")
    permissions: Mapped[list[Permission]] = relationship("Permission", secondary=role_permissions, back_populates="roles")


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(240), default="")

    roles: Mapped[list[Role]] = relationship(Role, secondary=role_permissions, back_populates="permissions")


class DispatchCreate(BaseModel):
    customer: str = Field(min_length=2, max_length=120)
    pickup: str = Field(min_length=2, max_length=160)
    dropoff: str = Field(min_length=2, max_length=160)
    vehicle: str = Field(min_length=2, max_length=64)
    planner: str = Field(min_length=2, max_length=64)
    window: str = Field(min_length=3, max_length=64)
    status: DispatchStatus = DispatchStatus.SCHEDULED


class DispatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    customer: str
    pickup: str
    dropoff: str
    vehicle: str
    planner: str
    window: str
    status: str


class CustomerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    tier: str = Field(min_length=2, max_length=32)
    lanes: int = Field(ge=0, le=500)
    monthly_spend: float = Field(ge=0)
    sla: float = Field(ge=0, le=100)
    owner: str = Field(min_length=2, max_length=64)
    risk: CustomerRisk = CustomerRisk.LOW


class CustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    tier: str
    lanes: int
    monthly_spend: float
    sla: float
    owner: str
    risk: str


class ActionRequest(BaseModel):
    action: str = Field(min_length=2, max_length=120)
    payload: dict[str, Any] = Field(default_factory=dict)


class ActionResponse(BaseModel):
    status: str
    action: str
    message: str


class TrackRoute(BaseModel):
    id: str
    origin: str
    destination: str
    progress: int = Field(ge=0, le=100)
    risk: CustomerRisk | str
    vehicle: str
    driver: str
    eta: str
    temperature: str


class OptimizeRouteRequest(BaseModel):
    routes: list[TrackRoute]


class OptimizeRouteResponse(BaseModel):
    status: str
    projected_delay_reduction_minutes: int
    routes: list[TrackRoute]


class ExportScope(StrEnum):
    ALL = "all"
    DISPATCHES = "dispatches"
    CUSTOMERS = "customers"
    ACTIONS = "actions"


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=6, max_length=128)


class AuthUserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    status: str


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str
    user: AuthUserResponse
    roles: list[str]
    permissions: list[str]


def database_url() -> tuple[str, dict[str, Any]]:
    driver = os.getenv("DB_DRIVER", "sqlite").lower()

    if driver == "mysql":
        return (
            "mysql+pymysql://"
            f"{os.getenv('DB_USERNAME', 'logistics')}:{os.getenv('DB_PASSWORD', 'secret')}"
            f"@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '3306')}"
            f"/{os.getenv('DB_DATABASE', 'logistics')}",
            {},
        )

    if driver in {"postgres", "postgresql"}:
        return (
            "postgresql+psycopg2://"
            f"{os.getenv('DB_USERNAME', 'logistics')}:{os.getenv('DB_PASSWORD', 'secret')}"
            f"@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}"
            f"/{os.getenv('DB_DATABASE', 'logistics')}",
            {},
        )

    return ("sqlite:///./fleet.db", {"check_same_thread": False})


DB_URL, CONNECT_ARGS = database_url()
engine = create_engine(DB_URL, connect_args=CONNECT_ARGS)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
TOKEN_SECRET = os.getenv("AUTH_SECRET", "dev-fleet-secret")
ACCESS_TOKEN_TTL_SECONDS = int(os.getenv("ACCESS_TOKEN_TTL_SECONDS", "86400"))
http_bearer = HTTPBearer(auto_error=False)


app = FastAPI(
    title="Logistics Fleet Management API",
    description="FastAPI backend for the Logistics & Fleet Management platform.",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> Session:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, digest = password_hash.split("$", maxsplit=1)
    except ValueError:
        return False

    candidate = hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()
    return hmac.compare_digest(candidate, digest)


def create_access_token(user_id: int) -> str:
    payload = {
        "sub": user_id,
        "exp": int(time.time()) + ACCESS_TOKEN_TTL_SECONDS,
        "nonce": secrets.token_hex(8),
    }
    encoded_payload = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(TOKEN_SECRET.encode("utf-8"), encoded_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{encoded_payload}.{signature}"


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        encoded_payload, signature = token.split(".", maxsplit=1)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format") from exc

    expected_signature = hmac.new(TOKEN_SECRET.encode("utf-8"), encoded_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature")

    try:
        payload = json.loads(_b64url_decode(encoded_payload).decode("utf-8"))
    except (ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload") from exc

    if payload.get("exp", 0) < int(time.time()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")

    return payload


def user_roles_and_permissions(user: User) -> tuple[list[str], list[str]]:
    roles = sorted({role.name for role in user.roles})
    permissions = sorted({permission.code for role in user.roles for permission in role.permissions})
    return roles, permissions


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")

    if not isinstance(user_id, int):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = db.get(User, user_id)
    if user is None or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not available")

    return user


def require_permission(permission_code: str) -> Callable[..., User]:
    def _dependency(
        user: User = Depends(get_current_user),
    ) -> User:
        permission_set = {permission.code for role in user.roles for permission in role.permissions}
        if permission_code not in permission_set:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing permission: {permission_code}")
        return user

    return _dependency


def ensure_roles_permissions_users(db: Session) -> None:
    permission_seed = {
        "dispatch:read": "View dispatch records",
        "dispatch:create": "Create dispatch records",
        "dispatch:import": "Import dispatch orders",
        "dispatch:filter": "Filter dispatch board",
        "customer:read": "View customer records",
        "customer:create": "Create customer records",
        "route:optimize": "Optimize active routes",
        "report:export": "Export reports",
        "action:log": "Log operational actions",
        "user:invite": "Invite workspace users",
    }

    for code, description in permission_seed.items():
        existing = db.scalar(select(Permission).where(Permission.code == code))
        if existing is None:
            db.add(Permission(code=code, description=description))
    db.flush()

    role_seed: dict[str, tuple[str, set[str]]] = {
        "admin": (
            "Full system access",
            set(permission_seed.keys()),
        ),
        "dispatcher": (
            "Dispatch operations",
            {
                "dispatch:read",
                "dispatch:create",
                "dispatch:import",
                "dispatch:filter",
                "customer:read",
                "route:optimize",
                "action:log",
                "report:export",
            },
        ),
        "finance": (
            "Finance operations",
            {"customer:read", "report:export", "action:log"},
        ),
    }

    all_permissions = {item.code: item for item in db.scalars(select(Permission)).all()}

    for role_name, (description, permission_codes) in role_seed.items():
        role = db.scalar(select(Role).where(Role.name == role_name))
        if role is None:
            role = Role(name=role_name, description=description)
            db.add(role)
            db.flush()

        role.description = description
        role.permissions = [all_permissions[code] for code in sorted(permission_codes)]

    users_seed = [
        {
            "email": "admin@fleet.local",
            "name": "Fleet Admin",
            "password": "admin123",
            "roles": ["admin"],
        },
        {
            "email": "dispatcher@fleet.local",
            "name": "Dispatch Operator",
            "password": "dispatch123",
            "roles": ["dispatcher"],
        },
    ]

    roles_by_name = {item.name: item for item in db.scalars(select(Role)).all()}

    for seed in users_seed:
        user = db.scalar(select(User).where(User.email == seed["email"]))
        if user is None:
            user = User(
                email=seed["email"],
                full_name=seed["name"],
                password_hash=hash_password(seed["password"]),
                status="active",
            )
            db.add(user)
            db.flush()

        user.full_name = seed["name"]
        user.status = "active"
        user.roles = [roles_by_name[name] for name in seed["roles"] if name in roles_by_name]


def seed_data(db: Session) -> None:
    ensure_roles_permissions_users(db)

    dispatch_count = db.scalar(select(func.count()).select_from(Dispatch))
    customer_count = db.scalar(select(func.count()).select_from(Customer))

    if not dispatch_count:
        demo_dispatches = [
            Dispatch(
                code="DSP-4182",
                customer="Orbit Pharma",
                pickup="Karachi Port",
                dropoff="Multan Yard",
                vehicle="TRK-118",
                planner="Imran",
                window="13:00 - 16:00",
                status=DispatchStatus.DELAYED.value,
            ),
            Dispatch(
                code="DSP-4179",
                customer="Nexus Retail",
                pickup="Lahore Hub",
                dropoff="Islamabad DC",
                vehicle="TRK-219",
                planner="Sana",
                window="12:30 - 15:30",
                status=DispatchStatus.LOADING.value,
            ),
            Dispatch(
                code="DSP-4176",
                customer="Metro Mart",
                pickup="Faisalabad Node",
                dropoff="City Core",
                vehicle="VAN-302",
                planner="Adeel",
                window="15:00 - 17:30",
                status=DispatchStatus.SCHEDULED.value,
            ),
            Dispatch(
                code="DSP-4171",
                customer="Delta Foods",
                pickup="Cold Store 04",
                dropoff="North Hub",
                vehicle="TRK-221",
                planner="Hira",
                window="10:00 - 14:00",
                status=DispatchStatus.COMPLETED.value,
            ),
        ]
        db.add_all(demo_dispatches)

    if not customer_count:
        demo_customers = [
            Customer(
                name="Orbit Pharma",
                tier="Enterprise",
                lanes=18,
                monthly_spend=92400,
                sla=98.5,
                owner="Nadia",
                risk=CustomerRisk.HIGH.value,
            ),
            Customer(
                name="Nexus Retail",
                tier="Growth",
                lanes=12,
                monthly_spend=48800,
                sla=96.1,
                owner="Faraz",
                risk=CustomerRisk.LOW.value,
            ),
            Customer(
                name="Delta Foods",
                tier="Enterprise",
                lanes=15,
                monthly_spend=63200,
                sla=94.8,
                owner="Mariam",
                risk=CustomerRisk.MEDIUM.value,
            ),
            Customer(
                name="Metro Mart",
                tier="Standard",
                lanes=9,
                monthly_spend=24600,
                sla=95.7,
                owner="Bilal",
                risk=CustomerRisk.LOW.value,
            ),
        ]
        db.add_all(demo_customers)

    db.commit()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_data(db)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Logistics Fleet Management FastAPI backend is running"}


@app.get("/api")
def api_root() -> dict[str, str]:
    return {"message": "API root"}


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/auth/login", response_model=AuthSessionResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthSessionResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or user.status != "active" or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    roles, permissions = user_roles_and_permissions(user)
    token = create_access_token(user.id)

    return AuthSessionResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserResponse(id=user.id, email=user.email, full_name=user.full_name, status=user.status),
        roles=roles,
        permissions=permissions,
    )


@app.get("/api/auth/me", response_model=AuthSessionResponse)
def me(user: User = Depends(get_current_user)) -> AuthSessionResponse:
    roles, permissions = user_roles_and_permissions(user)
    token = create_access_token(user.id)

    return AuthSessionResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserResponse(id=user.id, email=user.email, full_name=user.full_name, status=user.status),
        roles=roles,
        permissions=permissions,
    )


@app.get("/api/dispatches", response_model=list[DispatchRead])
def list_dispatches(
    _user: User = Depends(require_permission("dispatch:read")),
    db: Session = Depends(get_db),
) -> list[Dispatch]:
    statement = select(Dispatch).order_by(Dispatch.id.desc())
    return list(db.scalars(statement))


@app.post("/api/dispatches", response_model=DispatchRead)
def create_dispatch(
    payload: DispatchCreate,
    _user: User = Depends(require_permission("dispatch:create")),
    db: Session = Depends(get_db),
) -> Dispatch:
    dispatch = Dispatch(
        code="PENDING",
        customer=payload.customer,
        pickup=payload.pickup,
        dropoff=payload.dropoff,
        vehicle=payload.vehicle,
        planner=payload.planner,
        window=payload.window,
        status=payload.status.value,
    )
    db.add(dispatch)
    db.flush()

    dispatch.code = f"DSP-{4170 + dispatch.id}"
    db.commit()
    db.refresh(dispatch)
    return dispatch


@app.get("/api/customers", response_model=list[CustomerRead])
def list_customers(
    _user: User = Depends(require_permission("customer:read")),
    db: Session = Depends(get_db),
) -> list[Customer]:
    statement = select(Customer).order_by(Customer.monthly_spend.desc())
    return list(db.scalars(statement))


@app.post("/api/customers", response_model=CustomerRead)
def create_customer(
    payload: CustomerCreate,
    _user: User = Depends(require_permission("customer:create")),
    db: Session = Depends(get_db),
) -> Customer:
    existing = db.scalar(select(Customer).where(Customer.name == payload.name))
    if existing:
        raise HTTPException(status_code=409, detail="Customer already exists")

    customer = Customer(
        name=payload.name,
        tier=payload.tier,
        lanes=payload.lanes,
        monthly_spend=payload.monthly_spend,
        sla=payload.sla,
        owner=payload.owner,
        risk=payload.risk.value,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@app.post("/api/actions", response_model=ActionResponse)
def log_action(
    payload: ActionRequest,
    _user: User = Depends(require_permission("action:log")),
    db: Session = Depends(get_db),
) -> ActionResponse:
    entry = ActionLog(action=payload.action, details=json.dumps(payload.payload, default=str))
    db.add(entry)
    db.commit()

    return ActionResponse(
        status="ok",
        action=payload.action,
        message=f"Action '{payload.action}' completed successfully.",
    )


def _risk_weight(risk: str) -> int:
    mapping = {
        "high": 3,
        "medium": 2,
        "low": 1,
    }
    return mapping.get(risk.lower(), 1)


@app.post("/api/routes/optimize", response_model=OptimizeRouteResponse)
def optimize_routes(
    payload: OptimizeRouteRequest,
    _user: User = Depends(require_permission("route:optimize")),
) -> OptimizeRouteResponse:
    ranked = sorted(
        payload.routes,
        key=lambda route: (_risk_weight(str(route.risk)) * -1, -route.progress),
    )

    improved: list[TrackRoute] = []
    reduction_minutes = 0

    for route in ranked:
        penalty = _risk_weight(str(route.risk)) * 4
        reduction_minutes += penalty

        optimized_eta = (datetime.now(UTC) + timedelta(minutes=max(15, 120 - route.progress - penalty))).strftime("%H:%M")

        improved.append(
            TrackRoute(
                id=route.id,
                origin=route.origin,
                destination=route.destination,
                progress=min(100, route.progress + penalty),
                risk=route.risk,
                vehicle=route.vehicle,
                driver=route.driver,
                eta=optimized_eta,
                temperature=route.temperature,
            )
        )

    return OptimizeRouteResponse(
        status="ok",
        projected_delay_reduction_minutes=reduction_minutes,
        routes=improved,
    )


@app.get("/api/exports/{scope}")
def export_data(
    scope: ExportScope,
    _user: User = Depends(require_permission("report:export")),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    output = io.StringIO()
    writer = csv.writer(output)

    if scope in {ExportScope.ALL, ExportScope.DISPATCHES}:
        writer.writerow(["Dispatches"])
        writer.writerow(["Code", "Customer", "Pickup", "Dropoff", "Vehicle", "Planner", "Window", "Status"])
        for item in db.scalars(select(Dispatch).order_by(Dispatch.id.desc())):
            writer.writerow([item.code, item.customer, item.pickup, item.dropoff, item.vehicle, item.planner, item.window, item.status])
        writer.writerow([])

    if scope in {ExportScope.ALL, ExportScope.CUSTOMERS}:
        writer.writerow(["Customers"])
        writer.writerow(["Name", "Tier", "Lanes", "Monthly Spend", "SLA", "Owner", "Risk"])
        for item in db.scalars(select(Customer).order_by(Customer.monthly_spend.desc())):
            writer.writerow([item.name, item.tier, item.lanes, f"{item.monthly_spend:.2f}", f"{item.sla:.1f}", item.owner, item.risk])
        writer.writerow([])

    if scope in {ExportScope.ALL, ExportScope.ACTIONS}:
        writer.writerow(["Action Logs"])
        writer.writerow(["Action", "Details", "Timestamp"])
        for item in db.scalars(select(ActionLog).order_by(ActionLog.id.desc()).limit(100)):
            writer.writerow([item.action, item.details, item.created_at.isoformat()])

    filename = f"fleet-{scope.value}-export.csv"
    content = output.getvalue()
    output.close()

    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
