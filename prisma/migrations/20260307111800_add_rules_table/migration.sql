-- CreateTable
CREATE TABLE "rules" (
    "id" SERIAL NOT NULL,
    "rule_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "topic" INTEGER NOT NULL,
    "topic_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "spec_text" TEXT NOT NULL,
    "compliant_examples" JSONB NOT NULL,
    "non_compliant_examples" JSONB NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rules_rule_id_key" ON "rules"("rule_id");
