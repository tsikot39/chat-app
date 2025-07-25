"use client";

import { useState, useEffect } from "react";
import { User } from "@/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MessageCircle } from "lucide-react";
import { authenticatedFetch } from "@/lib/fetch";
import { getUserAvatar } from "@/lib/avatar";

interface UserListProps {
  onSelectUser: (user: User) => void;
}

export function UserList({ onSelectUser }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchUsers();

    // Refresh user list periodically to update online status
    const interval = setInterval(fetchUsers, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async (query?: string) => {
    setIsLoading(true);
    // Mark as searched only when there's a query (search performed)
    if (query !== undefined) {
      setHasSearched(true);
    }

    try {
      const url = query
        ? `/api/users?query=${encodeURIComponent(query)}`
        : "/api/users";
      const response = await authenticatedFetch(url);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === "") {
      // If search is empty, reset to show all users and clear search state
      setHasSearched(false);
      fetchUsers();
    } else {
      fetchUsers(searchQuery);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="h-full rounded-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              // If user clears the search, reset the search state and fetch all users
              if (e.target.value === "") {
                setHasSearched(false);
                fetchUsers();
              }
            }}
            className="flex-1 !text-white !bg-gray-800 placeholder:text-gray-400 border-gray-600 focus:border-gray-500"
          />
          <Button type="submit" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : users.length === 0 && hasSearched ? (
            <div className="text-center py-4 text-muted-foreground">
              No users found
            </div>
          ) : users.length > 0 ? (
            users.map((user) => {
              return (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => onSelectUser(user)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={getUserAvatar(user.image)}
                        alt={user.name}
                      />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
