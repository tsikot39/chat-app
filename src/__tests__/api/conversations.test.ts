import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/conversations/route";
import { getServerSession } from "next-auth/next";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Conversation from "@/models/Conversation";

// Mock dependencies
jest.mock("next-auth/next");
jest.mock("@/lib/mongodb");
jest.mock("@/models/User");
jest.mock("@/models/Conversation");

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;
const mockConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockUser = User as jest.Mocked<typeof User>;
const mockConversation = Conversation as jest.Mocked<typeof Conversation>;

describe("/api/conversations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectDB.mockResolvedValue(undefined);
  });

  describe("GET /api/conversations", () => {
    it("returns conversations for authenticated user", async () => {
      const mockSession = {
        user: { id: "user1", email: "test@example.com" },
      };

      const mockConversations = [
        {
          _id: "conv1",
          participants: ["user1", "user2"],
          lastMessage: "Hello",
          lastMessageAt: new Date(),
        },
      ];

      mockGetServerSession.mockResolvedValue(mockSession);
      mockConversation.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockConversations),
        }),
      } as unknown as any);

      const request = new NextRequest(
        "http://localhost:3000/api/conversations"
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversations).toEqual(mockConversations);
    });

    it("returns 401 for unauthenticated user", async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/conversations"
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/conversations", () => {
    it("creates conversation when privacy allows", async () => {
      const mockSession = {
        user: { id: "user1", email: "test@example.com" },
      };

      const mockParticipant = {
        _id: "user2",
        settings: {
          privacy: {
            whoCanMessage: "everyone",
          },
        },
      };

      const mockNewConversation = {
        _id: "conv1",
        participants: ["user1", "user2"],
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockUser.findById.mockResolvedValue(mockParticipant);
      mockConversation.findOne.mockResolvedValue(null); // No existing conversation
      mockConversation.create.mockResolvedValue([mockNewConversation]);
      mockConversation.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockNewConversation),
      } as unknown as any);

      const request = new NextRequest(
        "http://localhost:3000/api/conversations",
        {
          method: "POST",
          body: JSON.stringify({ participantId: "user2" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.conversation).toEqual(mockNewConversation);
    });

    it("blocks conversation creation when privacy is set to nobody", async () => {
      const mockSession = {
        user: { id: "user1", email: "test@example.com" },
      };

      const mockParticipant = {
        _id: "user2",
        settings: {
          privacy: {
            whoCanMessage: "nobody",
          },
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockUser.findById.mockResolvedValue(mockParticipant);

      const request = new NextRequest(
        "http://localhost:3000/api/conversations",
        {
          method: "POST",
          body: JSON.stringify({ participantId: "user2" }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it("returns existing conversation if one exists", async () => {
      const mockSession = {
        user: { id: "user1", email: "test@example.com" },
      };

      const mockExistingConversation = {
        _id: "existing-conv",
        participants: ["user1", "user2"],
      };

      mockGetServerSession.mockResolvedValue(mockSession);
      mockConversation.findOne.mockResolvedValue(mockExistingConversation);
      mockConversation.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockExistingConversation),
      } as unknown as any);

      const request = new NextRequest(
        "http://localhost:3000/api/conversations",
        {
          method: "POST",
          body: JSON.stringify({ participantId: "user2" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversation).toEqual(mockExistingConversation);
    });
  });
});
