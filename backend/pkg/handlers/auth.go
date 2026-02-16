package handlers

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/figif/backend/pkg/session"
)

// ContextKey is a type for context keys
type ContextKey string

const (
	// SessionClaimsKey is the context key for session claims
	SessionClaimsKey ContextKey = "sessionClaims"
)

// AuthMiddleware creates a middleware that validates JWT tokens
func AuthMiddleware(sessionManager *session.SessionManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header required", http.StatusUnauthorized)
				return
			}

			// Check for Bearer token format
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "Invalid authorization header format. Expected: Bearer <token>", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]

			// Validate token
			claims, err := sessionManager.ValidateToken(tokenString)
			if err != nil {
				http.Error(w, fmt.Sprintf("Invalid token: %v", err), http.StatusUnauthorized)
				return
			}

			// Verify session exists and is not expired
			_, err = sessionManager.GetSession(claims.SessionID)
			if err != nil {
				http.Error(w, fmt.Sprintf("Session error: %v", err), http.StatusUnauthorized)
				return
			}

			// Add claims to request context
			ctx := context.WithValue(r.Context(), SessionClaimsKey, claims)

			// Call next handler with updated context
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetSessionClaims extracts session claims from request context
func GetSessionClaims(r *http.Request) (*session.SessionClaims, error) {
	claims, ok := r.Context().Value(SessionClaimsKey).(*session.SessionClaims)
	if !ok {
		return nil, fmt.Errorf("session claims not found in context")
	}
	return claims, nil
}

// GetSessionID is a convenience function to extract just the session ID
func GetSessionID(r *http.Request) (string, error) {
	claims, err := GetSessionClaims(r)
	if err != nil {
		return "", err
	}
	return claims.SessionID, nil
}

// OptionalAuthMiddleware creates a middleware that validates JWT tokens if present,
// but allows requests without authentication to pass through
func OptionalAuthMiddleware(sessionManager *session.SessionManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract token from Authorization header
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				// No auth header, allow request to continue
				next.ServeHTTP(w, r)
				return
			}

			// Check for Bearer token format
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				// Invalid format, but don't block request
				next.ServeHTTP(w, r)
				return
			}

			tokenString := parts[1]

			// Validate token
			claims, err := sessionManager.ValidateToken(tokenString)
			if err != nil {
				// Invalid token, but don't block request
				next.ServeHTTP(w, r)
				return
			}

			// Verify session exists
			_, err = sessionManager.GetSession(claims.SessionID)
			if err != nil {
				// Session error, but don't block request
				next.ServeHTTP(w, r)
				return
			}

			// Add claims to request context
			ctx := context.WithValue(r.Context(), SessionClaimsKey, claims)

			// Call next handler with updated context
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
