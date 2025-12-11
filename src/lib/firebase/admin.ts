import jwt from "jsonwebtoken";
import { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;

// Loads Firebase public JWKS keys
const client = jwksClient({
    jwksUri: "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
    cache: true,
    cacheMaxAge: 86400000,
});

// Gets the public key for the given JWT header
function getKey(header: JwtHeader, callback: SigningKeyCallback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

// Verifies the ID token and returns the decoded token
export async function verifyIdToken(token: string | null) {
    if (!token) return null;

    try {
        const decoded = await new Promise<{
            uid: string;
            email?: string;
        }>((resolve, reject) => {
            jwt.verify(
                token,
                getKey,
                {
                    algorithms: ["RS256"],
                    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
                    audience: FIREBASE_PROJECT_ID,
                },
                (err, decoded) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(decoded as { uid: string; email?: string });
                    }
                }
            );
        });

        return decoded;
    } catch (e) {
        return null;
    }
}