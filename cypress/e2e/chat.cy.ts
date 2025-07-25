describe("NexusChat E2E Tests", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should load the homepage", () => {
    cy.contains("NexusChat").should("be.visible");
  });

  it("should allow user authentication", () => {
    // Test authentication flow
    cy.get('[data-testid="sign-in-button"]').click();
    // Add more authentication steps based on your auth provider
  });

  it("should allow sending messages", () => {
    // Mock authenticated state
    cy.intercept("GET", "/api/auth/session", {
      fixture: "authenticated-session.json",
    });

    cy.visit("/chat");

    // Test message sending
    cy.get('[data-testid="message-input"]').type("Hello, World!");
    cy.get('[data-testid="send-button"]').click();

    cy.contains("Hello, World!").should("be.visible");
  });

  it("should show typing indicators", () => {
    // Mock authenticated state and socket events
    cy.intercept("GET", "/api/auth/session", {
      fixture: "authenticated-session.json",
    });

    cy.visit("/chat");

    // Simulate typing
    cy.get('[data-testid="message-input"]').type("Testing typing...");

    // Check for typing indicator (this would need socket simulation)
    cy.contains("is typing").should("be.visible");
  });
});
