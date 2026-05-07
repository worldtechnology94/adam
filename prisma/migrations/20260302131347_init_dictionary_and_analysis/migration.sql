-- CreateTable
CREATE TABLE "ste_words" (
    "id" SERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "word_display" TEXT,
    "pos" TEXT,
    "approved" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ste_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ste_word_forms" (
    "id" SERIAL NOT NULL,
    "word_id" INTEGER NOT NULL,
    "form" TEXT NOT NULL,

    CONSTRAINT "ste_word_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ste_meanings" (
    "id" SERIAL NOT NULL,
    "word_id" INTEGER NOT NULL,
    "meaning" TEXT,
    "approved_as_is" BOOLEAN NOT NULL DEFAULT true,
    "alternative_word" TEXT,
    "alternative_pos" TEXT,

    CONSTRAINT "ste_meanings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ste_examples" (
    "id" SERIAL NOT NULL,
    "word_id" INTEGER NOT NULL,
    "ste_text" TEXT,
    "non_ste_text" TEXT,

    CONSTRAINT "ste_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_words" (
    "id" SERIAL NOT NULL,
    "org_id" INTEGER,
    "word" TEXT NOT NULL,
    "pos" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,

    CONSTRAINT "custom_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "word_count" INTEGER,
    "sentence_count" INTEGER,
    "document_type" TEXT,
    "revision" TEXT,
    "author" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analysis_runs" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compliance_score" INTEGER,
    "total_violations" INTEGER,
    "summary" JSONB,

    CONSTRAINT "analysis_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violations" (
    "id" SERIAL NOT NULL,
    "analysis_run_id" INTEGER NOT NULL,
    "sentence_excerpt" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "sentence_type" TEXT,
    "word_count" INTEGER,
    "severity" TEXT NOT NULL,
    "position_start" INTEGER,
    "position_end" INTEGER,
    "ai_suggestion" TEXT,
    "paragraph_context" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ste_word_forms_form_idx" ON "ste_word_forms"("form");

-- AddForeignKey
ALTER TABLE "ste_word_forms" ADD CONSTRAINT "ste_word_forms_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "ste_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ste_meanings" ADD CONSTRAINT "ste_meanings_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "ste_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ste_examples" ADD CONSTRAINT "ste_examples_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "ste_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violations" ADD CONSTRAINT "violations_analysis_run_id_fkey" FOREIGN KEY ("analysis_run_id") REFERENCES "analysis_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
