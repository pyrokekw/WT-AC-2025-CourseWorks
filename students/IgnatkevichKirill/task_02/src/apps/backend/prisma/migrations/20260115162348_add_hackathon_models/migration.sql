CREATE TABLE "Hackathon" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "theme" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "ideaSubmissionEnd" TIMESTAMP(3),
    "maxIdeasPerUser" INTEGER NOT NULL DEFAULT 3,
    "rules" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hackathon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HackathonIdea" (
    "id" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER,

    CONSTRAINT "HackathonIdea_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HackathonParticipant" (
    "id" TEXT NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ideasSubmitted" INTEGER NOT NULL DEFAULT 0,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "HackathonParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HackathonIdea_hackathonId_ideaId_key" ON "HackathonIdea"("hackathonId", "ideaId");

CREATE UNIQUE INDEX "HackathonParticipant_hackathonId_userId_key" ON "HackathonParticipant"("hackathonId", "userId");

ALTER TABLE "HackathonIdea" ADD CONSTRAINT "HackathonIdea_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HackathonIdea" ADD CONSTRAINT "HackathonIdea_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HackathonParticipant" ADD CONSTRAINT "HackathonParticipant_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "Hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HackathonParticipant" ADD CONSTRAINT "HackathonParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;