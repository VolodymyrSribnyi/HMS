# AGENTS.md — Hotel Management System (HMS)

> Цей файл є основним джерелом контексту для AI-агентів (Codex, Gemini CLI).
> Читай його повністю перед тим, як вносити будь-які зміни в проєкт.

---

## 1. Огляд проєкту

HMS — університетська курсова робота. REST API на ASP.NET Core 10 + React 18 SPA.
Мета — production-quality код із реальними архітектурними патернами.

**Бекенд:** `./` (рішення .sln у корені)
**Фронтенд:** `./hms-frontend/` (Vite + React 18 + TypeScript)
**БД:** SQL Server LocalDB (dev) → Azure SQL (prod)

---

## 2. Структура рішення

```
HMS/
├── Domain/01_Domain.csproj           ← Entities, Enums, Domain Interfaces
├── Application/02Application.csproj  ← Commands, Queries, Handlers, Validators, DTOs
├── Infrastructure/03Infrastructure.csproj ← EF Core, Identity, JWT, Repositories, Migrations
├── HMS.API/                          ← Controllers, Program.cs, Middleware
└── hms-frontend/                     ← React SPA (окремий AGENTS.md всередині)
```

### 2.1 Domain (`01_Domain.csproj`)

Залежностей немає. Тільки чисті C#-класи.

**Entities:**
- `ApplicationUser` — знаходиться в `Infrastructure.Identity`, успадковує `IdentityUser<Guid>`
- `UserProfile` — дзеркало `ApplicationUser` у домені (той самий `Guid` як PK, `ValueGeneratedNever`)
- `Room` — має `byte[] Version` (SQL rowversion для optimistic concurrency)
- `RoomType`
- `Booking` — FK до `UserProfile` (GuestId), до `Room` (AssignedRoomId, nullable), до `RoomType`
- `BookingHistory` — changelog статусів бронювання
- `Invoice` — 1:1 до `Booking`
- `Payment` — багато до `Invoice`
- `CleaningTask` — FK до `Room`, до `UserProfile` (AssignedMaidId, nullable)
- `AuditLog` — FK до `UserProfile` (UserId, nullable, OnDelete=SetNull)
- `RefreshToken` — знаходиться в `Infrastructure.Identity`

**Enums:** `BookingStatus`, `RoomStatus`, `CleaningTaskStatus`

**Domain Interfaces:**
- `IBookingRepository` — тільки для складних запитів доступності (не CRUD)
- `IRoomTypeRepository` — залишено порожнім (всі методи закоментовані)

### 2.2 Application (`02Application.csproj`)

**Посилається на:** Domain

**Структура папок:**
```
Application/
├── Authentication/
│   ├── Commands/          ← AuthUserCommand, CreateUserCommand, RefreshTokenCommand
│   ├── CommandHandlers/
│   └── Validations/
├── Bookings/
│   ├── Commands/          ← CreateBookingCommand, UpdateBookingCommand, DeleteBookingCommand
│   ├── CommandHandlers/
│   ├── Queries/           ← GetAllBookingsQuery, GetGuestsBookingsQuery
│   ├── QueryHandlers/
│   └── Validations/
├── Rooms/                 ← аналогічно Bookings
├── RoomTypes/             ← аналогічно Bookings
├── Common/
│   ├── Behavior/
│   │   └── ValidationBehavior.cs  ← MediatR pipeline behavior для FluentValidation
│   └── Interfaces/
│       ├── IHmsDbContext.cs
│       └── IIdentityService.cs    ← також IJwtUtils
├── DTOs/                  ← GetBookingDTO, GetRoomDTO, GetRoomTypeDTO, AuthResponseDTO
├── ErrorHandling/
│   ├── Error.cs           ← sealed record Error(string Code, string Description)
│   ├── Errors.cs          ← статичний клас з усіма визначеними помилками
│   └── Result.cs          ← Result та Result<T>
├── Mappers/               ← AutoMapper profiles
└── DependencyInjection.cs
```

### 2.3 Infrastructure (`03Infrastructure.csproj`)

**Посилається на:** Application

```
Infrastructure/
├── Data/
│   └── HmsDbContext.cs    ← IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
├── Identity/
│   ├── ApplicationUser.cs ← : IdentityUser<Guid>, має GoogleAuthId та RefreshTokens
│   ├── IdentityService.cs ← реалізує IIdentityService
│   ├── JwtUtils.cs        ← реалізує IJwtUtils
│   └── RefreshToken.cs
├── Migrations/
├── Repositories/
│   ├── BookingRepository.cs  ← реалізує IBookingRepository
│   └── RoomTypeRepository.cs ← порожній
├── ExceptionHandling/
│   └── ExceptionHandlingMiddleware.cs
└── DependencyInjection.cs
```

### 2.4 HMS.API

```
HMS.API/
├── Controllers/
│   ├── AuthController.cs
│   ├── BookingController.cs
│   ├── RoomController.cs
│   └── RoomTypeController.cs
├── Program.cs
└── appsettings.json
```

---

## 3. Ключові архітектурні патерни

### 3.1 Result<T> патерн

Кожен handler повертає `Result<T>` або `Result`. Ніяких виключень для бізнес-логіки.

```csharp
// Повернення успіху
return Result<Guid>.Success(entity.Id);

// Повернення помилки
return Result<Guid>.Failure(Errors.RoomNotFound);

// Перевірка в контролері
if (result.IsFailure)
    return ToActionResult(result);
return Ok(result.Value);
```

### 3.2 Error та Errors

```csharp
// Визначення нової помилки — завжди в Errors.cs
public static readonly Error CheckInNotAllowed = new("CHECKIN_NOT_ALLOWED", "...");

// Динамічна помилка (наприклад, з деталями)
public static Error ValidationFailed(string description) => new("VALIDATION_FAILED", description);
```

### 3.3 CQRS + MediatR

- **Commands** — змінюють стан, повертають `Result<T>` або `Result`
- **Queries** — лише читають, повертають `Result<IEnumerable<TDto>>`
- Handlers inject `IHmsDbContext` безпосередньо — **без зайвого шару репозиторіїв**
- `IBookingRepository` — виняток для складної логіки перевірки доступності

```csharp
// ПРАВИЛЬНО — ін'єктуємо IHmsDbContext прямо в handler
public class CreateRoomTypeCommandHandler : IRequestHandler<CreateRoomTypeCommand, Result<Guid>>
{
    private readonly IHmsDbContext _context;
    // ...
}

// НЕПРАВИЛЬНО — не огортай DbContext у зайвий IRoomTypeRepository для CRUD
```

### 3.4 FluentValidation через MediatR Pipeline

`ValidationBehavior<TRequest, TResponse>` автоматично викликається перед кожним handler.
Не викликай validators вручну в handlers.

Кожна команда має свій validator у папці `Validations/` поруч із handler.

### 3.5 Статичні фабричні методи на entity

```csharp
// ПРАВИЛЬНО
var room = Room.Create(request.RoomNumber, request.Floor, status, request.RoomTypeId);

// НЕПРАВИЛЬНО — не використовуй конструктори напряму з handlers
var room = new Room { RoomNumber = request.RoomNumber, ... };
```

### 3.6 Optimistic Concurrency (Room)

Room має `byte[] Version` (SQL rowversion). Клієнт отримує версію як Base64 рядок,
надсилає назад при UPDATE/DELETE, handler встановлює `OriginalValue` перед збереженням.

```csharp
_context.Entry(room).Property(nameof(room.Version)).OriginalValue =
    Convert.FromBase64String(request.RowVersion);
// catch DbUpdateConcurrencyException → return Errors.ConcurrencyConflict
```

---

## 4. Система автентифікації

### 4.1 Потік

```
POST /api/auth/register → CreateUserCommand → UserManager.CreateAsync
                                            → UserProfiles.Add (same Guid)
                                            → AddToRolesAsync (default: "Guest")

POST /api/auth/login    → AuthUserCommand → UserManager.CheckPasswordAsync
                                          → GenerateToken (JWT, 15хв)
                                          → GenerateRefreshToken (base64, 7 днів)
                                          → RefreshTokens.Add
                                          → AccessToken у body, RefreshToken у HttpOnly cookie

POST /api/auth/refresh  → RefreshTokenCommand → читає cookie "refreshToken"
                                              → перевіряє IsActive (не revoked, не expired)
                                              → revoke старий, додає новий
                                              → повертає нові токени
```

### 4.2 Identity Registration

```csharp
// ОБОВ'ЯЗКОВО AddIdentity (не AddIdentityCore!)
// AddIdentityCore не реєструє SignInManager, але головне — AddIdentity у JWT-only API
// потребує явного override DefaultAuthenticateScheme
services.AddIdentity<ApplicationUser, IdentityRole<Guid>>()
    .AddEntityFrameworkStores<HmsDbContext>()
    .AddDefaultTokenProviders();
```

### 4.3 JWT Claims

```csharp
new Claim(JwtRegisteredClaimNames.Sub, userName)
new Claim(JwtRegisteredClaimNames.Jti, userId.ToString())
new Claim("Name", fullName)
new Claim("UserId", userId.ToString())    ← читається в контролерах
new Claim(ClaimTypes.Role, role)          ← для [Authorize(Roles="...")]
```

### 4.4 Отримання UserId в контролері

```csharp
var userId = User.FindFirst("UserId")?.Value;
if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out Guid guestId))
    return Unauthorized(...);
```

### 4.5 Безпека

> ⚠️ **SECURITY TODO:** JWT Secret зараз в `appsettings.json`. Для dev — переноси в User Secrets.
> `dotnet user-secrets set "JwtSettings:Secret" "your-secret"`

---

## 5. База даних

### 5.1 HmsDbContext

`HmsDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>`

**Таблиці Identity (перейменовані):**
- `Users` ← ApplicationUser
- `Roles` ← IdentityRole<Guid>
- `UserRoles`, `UserClaims`, `UserLogins`, `UserTokens`, `RoleClaims`

**Бізнес-таблиці:**
- `UserProfiles`, `RoomTypes`, `Rooms`, `Bookings`, `BookingHistories`
- `Invoices`, `Payments`, `CleaningTasks`, `AuditLogs`, `RefreshTokens`

### 5.2 Ключові правила EF Core

```csharp
// ВАЖЛИВО: наприкінці OnModelCreating є глобальний loop,
// що змінює всі Cascade на Restrict
var cascadeFKs = modelBuilder.Model.GetEntityTypes()
    .SelectMany(t => t.GetForeignKeys())
    .Where(fk => !fk.IsOwnership && fk.DeleteBehavior == DeleteBehavior.Cascade);
foreach (var fk in cascadeFKs)
    fk.DeleteBehavior = DeleteBehavior.Restrict;

// Якщо тобі потрібен Cascade для нової entity — оголошуй явно ПІСЛЯ цього loop
// або встановлюй DeleteBehavior.Cascade до нього, щоб він не зачепив.
// Найпростіше — явно вказати DeleteBehavior у Fluent API до loop і
// залишити Cascade тільки там де треба (наприклад, BookingHistory → Booking).
```

```csharp
// UserProfile.Id — ValueGeneratedNever (той самий Guid що ApplicationUser.Id)
modelBuilder.Entity<UserProfile>(entity => {
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Id).ValueGeneratedNever();
});
```

### 5.3 Міграції

```bash
# Запускати з кореня рішення, вказуючи проєкт та startup project
dotnet ef migrations add MigrationName \
  --project Infrastructure \
  --startup-project HMS.API

dotnet ef database update \
  --project Infrastructure \
  --startup-project HMS.API
```

---

## 6. Ролі користувачів

| Роль | Назва в системі | Дозволи |
|------|-----------------|---------|
| Гість | `Guest` | Переглядати кімнати, керувати своїми бронюваннями |
| Рецепція | `Receptionist` | Check-in/Check-out, переглядати всі бронювання |
| Покоївка | `Maid` | Переглядати та оновлювати статус CleaningTask |
| Бухгалтер | `Accountant` | Переглядати рахунки, платежі, звіти |
| Адміністратор | `Admin` | Повний доступ, управління Room/RoomType, звіти |

> ⚠️ **TODO:** `[Authorize]` атрибути на endpoint'ах зараз без ролей.
> Потрібно додати `[Authorize(Roles = "Admin")]` тощо.

---

## 7. Поточний стан реалізації

### ✅ Реалізовано

- JWT автентифікація + Refresh Tokens
- CRUD для Room та RoomType (з optimistic concurrency)
- Бронювання: Create, Update, Delete, GetAll, GetGuestBookings
- FluentValidation через MediatR pipeline
- Global exception middleware
- CORS для React (порт 5173)
- AutoMapper (Room, RoomType, Booking DTOs)

### 🔲 Не реалізовано (TODO)

Нижче описано що потрібно зробити — не відтворюй вже існуючий код.

#### 7.1 Check-in / Check-out

Потрібні нові команди та handlers:

```
Application/Bookings/Commands/CheckInCommand.cs
Application/Bookings/CommandHandlers/CheckInCommandHandler.cs
Application/Bookings/Commands/CheckOutCommand.cs
Application/Bookings/CommandHandlers/CheckOutCommandHandler.cs
```

**CheckInCommandHandler** повинен:
1. Знайти бронювання за `BookingId`
2. Перевірити авторизацію (`Receptionist` або `Admin` role)
3. Перевірити що `booking.Status == BookingStatus.Confirmed`
4. Встановити `booking.Status = BookingStatus.CheckedIn`
5. Встановити `room.Status = RoomStatus.Occupied`
6. Зберегти запис у `BookingHistory`

**CheckOutCommandHandler** повинен:
1. Знайти бронювання (з `Include(b => b.AssignedRoom)`)
2. Перевірити `booking.Status == BookingStatus.CheckedIn`
3. Встановити `booking.Status = BookingStatus.CheckedOut`
4. Встановити `room.Status = RoomStatus.NeedsCleaning`
5. Створити `Invoice` (TotalAmount = booking.TotalPrice, IsClosed = false)
6. Створити `CleaningTask` (Status = Pending, RoomId = room.Id)
7. Зберегти запис у `BookingHistory`
8. Зберегти у БД одним `SaveChangesAsync`

#### 7.2 Invoice та Payment

```
Application/Invoices/Commands/RegisterPaymentCommand.cs
Application/Invoices/CommandHandlers/RegisterPaymentCommandHandler.cs
Application/Invoices/Queries/GetInvoiceByBookingIdQuery.cs
```

**RegisterPaymentCommandHandler** повинен:
1. Знайти Invoice за `InvoiceId` (Include Payments)
2. Перевірити що Invoice не закритий
3. Додати `Payment` (Amount, PaymentMethod, PaymentDate = UtcNow)
4. Якщо сума платежів >= Invoice.TotalAmount → `invoice.IsClosed = true`

#### 7.3 CleaningTask Management

```
Application/CleaningTasks/Commands/AssignCleaningTaskCommand.cs
Application/CleaningTasks/Commands/CompleteCleaningTaskCommand.cs
Application/CleaningTasks/QueryHandlers/GetPendingCleaningTasksQueryHandler.cs
```

**CompleteCleaningTaskCommandHandler** повинен:
1. Знайти task (Include Room)
2. Перевірити що виконавець — `Maid` або `Admin`
3. `task.Status = CleaningTaskStatus.Completed`, `task.CompletedAt = UtcNow`
4. `room.Status = RoomStatus.Available`

#### 7.4 AuditLog

Писати до `AuditLogs` у критичних handlers (CheckIn, CheckOut, Payment).
Отримувати `UserId` і `IpAddress` через `IHttpContextAccessor`.

Додати `IHttpContextAccessor` у handlers які потребують audit:
```csharp
services.AddHttpContextAccessor(); // вже є в Program.cs
```

#### 7.5 BookingHistory

Записувати при кожній зміні статусу бронювання:
```csharp
_context.BookingHistories.Add(new BookingHistory {
    Id = Guid.NewGuid(),
    BookingId = booking.Id,
    OldStatus = booking.Status,
    NewStatus = newStatus,
    ChangedAt = DateTime.UtcNow,
    ChangedByUserId = currentUserId
});
```

---

## 8. Правила іменування та конвенції

| Артефакт | Конвенція | Приклад |
|----------|-----------|---------|
| Command | `{Дія}{Entity}Command` | `CheckInCommand` |
| Handler | `{Command}Handler` | `CheckInCommandHandler` |
| Query | `Get{Entity}{Scope}Query` | `GetAllBookingsQuery` |
| Validator | `{Command}Validator` | `CheckInCommandValidator` |
| DTO | `{Entity}Dto` або `Get{Entity}DTO` | `GetBookingDTO` |
| Error | ALL_CAPS_SNAKE в Errors.cs | `Errors.CheckInNotAllowed` |
| Controller | `{Entity}Controller` | `BookingController` |

---

## 9. Заборонені патерни

```csharp
// ❌ НЕ РОБИТИ: зайвий repository wrapper навколо DbContext
public class RoomTypeRepository : IRoomTypeRepository
{
    Task<RoomType> GetAsync(Guid id) => _context.RoomTypes.FindAsync(id);
}
// Замість цього — ін'єктуй IHmsDbContext прямо в handler

// ❌ НЕ РОБИТИ: AddIdentityCore для JWT API
services.AddIdentityCore<ApplicationUser>()... // ламає SignInManager
// Правильно: services.AddIdentity<ApplicationUser, IdentityRole<Guid>>()

// ❌ НЕ РОБИТИ: direct FK RoleId на ApplicationUser
public Guid RoleId { get; set; } // конфліктує з Identity junction table
// Правильно: ролі через UserManager.AddToRolesAsync

// ❌ НЕ РОБИТИ: try-catch навколо SaveChangesAsync без потреби
// Виняток: DbUpdateConcurrencyException для optimistic concurrency на Room

// ❌ НЕ РОБИТИ: JWT Secret в appsettings.json (в Production)
// Правильно: User Secrets (dev), Azure Key Vault (prod)

// ❌ НЕ РОБИТИ: DateTime.Now у domain entities
// Правильно: DateTime.UtcNow

// ❌ НЕ РОБИТИ: ClockSkew default (5 хвилин) для токенів
// Правильно: ClockSkew = TimeSpan.Zero у TokenValidationParameters
```

---

## 10. Запуск проєкту

```bash
# Відновити залежності
dotnet restore

# Застосувати міграції
dotnet ef database update --project Infrastructure --startup-project HMS.API

# Запустити API (порт 7063 https, 5233 http)
dotnet run --project HMS.API

# Фронтенд (окремий термінал)
cd hms-frontend
npm install
npm run dev  # порт 5173
```

**Swagger UI:** `https://localhost:7063/swagger` (тільки в Development)

---

## 11. Залежності (ключові NuGet пакети)

| Пакет | Версія | Де |
|-------|--------|----|
| MediatR | 14.1.0 | Application |
| FluentValidation | 12.1.1 | Application |
| AutoMapper | 16.1.1 | Application |
| Microsoft.EntityFrameworkCore | 10.0.7 | Application, Infrastructure |
| Microsoft.EntityFrameworkCore.SqlServer | 10.0.7 | Infrastructure |
| Microsoft.AspNetCore.Identity.EntityFrameworkCore | 10.0.7 | Infrastructure |
| Swashbuckle.AspNetCore | 10.1.7 | HMS.API |
| Microsoft.AspNetCore.Authentication.JwtBearer | 10.0.7 | HMS.API |
