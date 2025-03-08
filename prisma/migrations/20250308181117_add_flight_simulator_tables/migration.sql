-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "aircraft" TEXT NOT NULL,
    "departure" TEXT NOT NULL,
    "arrival" TEXT NOT NULL,
    "initial_altitude" INTEGER NOT NULL,
    "initial_heading" INTEGER NOT NULL,
    "initial_fuel" INTEGER NOT NULL,
    "max_fuel" INTEGER NOT NULL,
    "fuel_burn_rate" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Waypoint" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL,
    "position_y" DOUBLE PRECISION NOT NULL,
    "sequence" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_passed" BOOLEAN NOT NULL DEFAULT false,
    "eta" TEXT,

    CONSTRAINT "Waypoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherCondition" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "weather_data" JSONB NOT NULL,

    CONSTRAINT "WeatherCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Decision" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "time_limit" INTEGER,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "trigger_condition" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Decision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionOption" (
    "id" TEXT NOT NULL,
    "decision_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "consequences" TEXT NOT NULL,
    "is_recommended" BOOLEAN NOT NULL DEFAULT false,
    "is_selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DecisionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationQueue" (
    "id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_important" BOOLEAN NOT NULL DEFAULT false,
    "trigger_condition" TEXT NOT NULL,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "CommunicationQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WeatherCondition_scenario_id_key" ON "WeatherCondition"("scenario_id");

-- AddForeignKey
ALTER TABLE "Waypoint" ADD CONSTRAINT "Waypoint_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherCondition" ADD CONSTRAINT "WeatherCondition_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisionOption" ADD CONSTRAINT "DecisionOption_decision_id_fkey" FOREIGN KEY ("decision_id") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationQueue" ADD CONSTRAINT "CommunicationQueue_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
