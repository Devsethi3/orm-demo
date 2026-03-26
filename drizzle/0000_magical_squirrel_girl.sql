CREATE TYPE "public"."BillingCycle" AS ENUM('MONTHLY', 'YEARLY', 'QUARTERLY', 'ONE_TIME');--> statement-breakpoint
CREATE TYPE "public"."InviteStatus" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."PaymentStatus" AS ENUM('PENDING', 'PAID', 'PARTIAL', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."TransactionSource" AS ENUM('PAYPAL', 'BANK', 'UPWORK', 'CONTRA', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."TransactionType" AS ENUM('INCOME', 'EXPENSE', 'TRANSFER');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('ADMIN', 'ACCOUNT_EXECUTIVE', 'PARTNER', 'CLIENT');--> statement-breakpoint
CREATE TYPE "public"."UserStatus" AS ENUM('ACTIVE', 'SUSPENDED', 'PENDING');--> statement-breakpoint
CREATE TABLE "AuditLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"action" text NOT NULL,
	"entityType" text NOT NULL,
	"entityId" text NOT NULL,
	"oldData" jsonb,
	"newData" jsonb,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Bonus" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" text NOT NULL,
	"reason" text NOT NULL,
	"paymentDate" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "BrandMember" (
	"id" text PRIMARY KEY NOT NULL,
	"brandId" text NOT NULL,
	"userId" text NOT NULL,
	"role" "UserRole" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "BrandMember_brandId_userId_key" UNIQUE("brandId","userId")
);
--> statement-breakpoint
CREATE TABLE "Brand" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"logoUrl" text,
	"ownerId" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Currency" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"symbol" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Employee" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"brandId" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"position" text NOT NULL,
	"department" text,
	"salaryAmount" numeric(15, 2) NOT NULL,
	"salaryCurrency" text DEFAULT 'USD' NOT NULL,
	"paymentDay" integer DEFAULT 1 NOT NULL,
	"joinDate" timestamp with time zone NOT NULL,
	"terminationDate" timestamp with time zone,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ExchangeRate" (
	"id" text PRIMARY KEY NOT NULL,
	"fromCurrencyId" text NOT NULL,
	"toCurrencyId" text NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"isManual" boolean DEFAULT false NOT NULL,
	"validFrom" timestamp with time zone DEFAULT now() NOT NULL,
	"validTo" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ExchangeRate_fromCurrencyId_toCurrencyId_validFrom_key" UNIQUE("fromCurrencyId","toCurrencyId","validFrom")
);
--> statement-breakpoint
CREATE TABLE "Invite" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" "UserRole" NOT NULL,
	"token" text NOT NULL,
	"status" "InviteStatus" DEFAULT 'PENDING' NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"invitedById" text NOT NULL,
	"brandId" text,
	"acceptedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Partner" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"brandId" text NOT NULL,
	"revenueShare" numeric(5, 2) NOT NULL,
	"profitShare" numeric(5, 2) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"joinDate" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Project" (
	"id" text PRIMARY KEY NOT NULL,
	"brandId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"clientName" text,
	"budget" numeric(15, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"startDate" timestamp with time zone,
	"endDate" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SalaryPayment" (
	"id" text PRIMARY KEY NOT NULL,
	"employeeId" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" text NOT NULL,
	"conversionRate" numeric(18, 8) NOT NULL,
	"usdValue" numeric(15, 2) NOT NULL,
	"paymentDate" timestamp with time zone NOT NULL,
	"periodStart" timestamp with time zone NOT NULL,
	"periodEnd" timestamp with time zone NOT NULL,
	"status" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"userAgent" text,
	"ipAddress" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text,
	"description" text,
	"cost" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"billingCycle" "BillingCycle" NOT NULL,
	"nextDueDate" timestamp with time zone NOT NULL,
	"lastPaidDate" timestamp with time zone,
	"category" text,
	"url" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"autoRenew" boolean DEFAULT true NOT NULL,
	"reminderDays" integer DEFAULT 7 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "SystemSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updatedById" text,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"brandId" text NOT NULL,
	"projectId" text,
	"type" "TransactionType" NOT NULL,
	"source" "TransactionSource" NOT NULL,
	"description" text,
	"originalAmount" numeric(15, 2) NOT NULL,
	"originalCurrency" text NOT NULL,
	"conversionRate" numeric(18, 8) NOT NULL,
	"usdValue" numeric(15, 2) NOT NULL,
	"transactionDate" timestamp with time zone NOT NULL,
	"reference" text,
	"notes" text,
	"createdById" text NOT NULL,
	"isReconciled" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"role" "UserRole" DEFAULT 'CLIENT' NOT NULL,
	"status" "UserStatus" DEFAULT 'PENDING' NOT NULL,
	"avatarUrl" text,
	"lastLoginAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Withdrawal" (
	"id" text PRIMARY KEY NOT NULL,
	"partnerId" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "PaymentStatus" DEFAULT 'PENDING' NOT NULL,
	"requestedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"processedAt" timestamp with time zone,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Bonus" ADD CONSTRAINT "Bonus_employeeId_Employee_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BrandMember" ADD CONSTRAINT "BrandMember_brandId_Brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "BrandMember" ADD CONSTRAINT "BrandMember_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_ownerId_User_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_brandId_Brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_fromCurrencyId_Currency_id_fk" FOREIGN KEY ("fromCurrencyId") REFERENCES "public"."Currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_toCurrencyId_Currency_id_fk" FOREIGN KEY ("toCurrencyId") REFERENCES "public"."Currency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_User_id_fk" FOREIGN KEY ("invitedById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_brandId_Brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Project" ADD CONSTRAINT "Project_brandId_Brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_employeeId_Employee_id_fk" FOREIGN KEY ("employeeId") REFERENCES "public"."Employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_updatedById_User_id_fk" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_brandId_Brand_id_fk" FOREIGN KEY ("brandId") REFERENCES "public"."Brand"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_projectId_Project_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_createdById_User_id_fk" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_partnerId_Partner_id_fk" FOREIGN KEY ("partnerId") REFERENCES "public"."Partner"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog" USING btree ("entityType","entityId");--> statement-breakpoint
CREATE INDEX "Bonus_employeeId_idx" ON "Bonus" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "BrandMember_brandId_idx" ON "BrandMember" USING btree ("brandId");--> statement-breakpoint
CREATE INDEX "BrandMember_userId_idx" ON "BrandMember" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "Brand_ownerId_idx" ON "Brand" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "Brand_slug_idx" ON "Brand" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "Currency_code_key" ON "Currency" USING btree ("code");--> statement-breakpoint
CREATE INDEX "Currency_code_idx" ON "Currency" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Employee_brandId_idx" ON "Employee" USING btree ("brandId");--> statement-breakpoint
CREATE INDEX "Employee_email_idx" ON "Employee" USING btree ("email");--> statement-breakpoint
CREATE INDEX "ExchangeRate_fromCurrencyId_toCurrencyId_idx" ON "ExchangeRate" USING btree ("fromCurrencyId","toCurrencyId");--> statement-breakpoint
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "Invite_email_idx" ON "Invite" USING btree ("email");--> statement-breakpoint
CREATE INDEX "Invite_token_idx" ON "Invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "Invite_status_idx" ON "Invite" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "Partner_userId_key" ON "Partner" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Partner_brandId_idx" ON "Partner" USING btree ("brandId");--> statement-breakpoint
CREATE INDEX "Partner_userId_idx" ON "Partner" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Project_brandId_idx" ON "Project" USING btree ("brandId");--> statement-breakpoint
CREATE INDEX "SalaryPayment_employeeId_idx" ON "SalaryPayment" USING btree ("employeeId");--> statement-breakpoint
CREATE INDEX "SalaryPayment_paymentDate_idx" ON "SalaryPayment" USING btree ("paymentDate");--> statement-breakpoint
CREATE INDEX "SalaryPayment_status_idx" ON "SalaryPayment" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "Session_token_key" ON "Session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "Session_userId_idx" ON "Session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "Session_token_idx" ON "Session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "Subscription_nextDueDate_idx" ON "Subscription" USING btree ("nextDueDate");--> statement-breakpoint
CREATE INDEX "Subscription_isActive_idx" ON "Subscription" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "Transaction_brandId_idx" ON "Transaction" USING btree ("brandId");--> statement-breakpoint
CREATE INDEX "Transaction_transactionDate_idx" ON "Transaction" USING btree ("transactionDate");--> statement-breakpoint
CREATE INDEX "Transaction_type_idx" ON "Transaction" USING btree ("type");--> statement-breakpoint
CREATE INDEX "Transaction_source_idx" ON "Transaction" USING btree ("source");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "User_email_idx" ON "User" USING btree ("email");--> statement-breakpoint
CREATE INDEX "User_role_idx" ON "User" USING btree ("role");--> statement-breakpoint
CREATE INDEX "User_status_idx" ON "User" USING btree ("status");--> statement-breakpoint
CREATE INDEX "Withdrawal_partnerId_idx" ON "Withdrawal" USING btree ("partnerId");--> statement-breakpoint
CREATE INDEX "Withdrawal_status_idx" ON "Withdrawal" USING btree ("status");