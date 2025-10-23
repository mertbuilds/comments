export interface Env {
  DB: D1Database;
}

interface User {
  id: number;
  ip_address: string;
  username: string;
  created_at: string;
}

interface CommentWithUser {
  id: number;
  content: string;
  position_x: number;
  position_y: number;
  username: string;
  created_at: string;
}

function generateRandomUsername(): string {
  const adjectives = [
    "Swift", "Brave", "Clever", "Bright", "Quick",
    "Bold", "Calm", "Wise", "Lucky", "Happy",
    "Cool", "Warm", "Fresh", "Wild", "Free",
    "Blue", "Red", "Green", "Golden", "Silver"
  ];

  const animals = [
    "Dolphin", "Eagle", "Tiger", "Panda", "Wolf",
    "Hawk", "Bear", "Fox", "Owl", "Lion",
    "Deer", "Whale", "Falcon", "Leopard", "Phoenix",
    "Dragon", "Raven", "Otter", "Lynx", "Jaguar"
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];

  return `${adjective} ${animal}`;
}

function getClientIP(request: Request): string {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

async function getOrCreateUser(db: D1Database, ipAddress: string): Promise<User> {
  const existingUser = await db
    .prepare("SELECT * FROM users WHERE ip_address = ? LIMIT 1")
    .bind(ipAddress)
    .first<User>();

  if (existingUser) {
    return existingUser;
  }

  const username = generateRandomUsername();

  await db
    .prepare("INSERT INTO users (ip_address, username) VALUES (?, ?)")
    .bind(ipAddress, username)
    .run();

  const newUser = await db
    .prepare("SELECT * FROM users WHERE ip_address = ? LIMIT 1")
    .bind(ipAddress)
    .first<User>();

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  return newUser;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/api/user" && request.method === "GET") {
      try {
        const ipAddress = getClientIP(request);
        const user = await getOrCreateUser(env.DB, ipAddress);

        return Response.json({ username: user.username });
      } catch (error) {
        console.error("Error fetching user:", error);
        return Response.json(
          { error: "Failed to fetch user" },
          { status: 500 }
        );
      }
    }

    if (pathname === "/api/comments" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(`
          SELECT
            comments.id,
            comments.content,
            comments.position_x,
            comments.position_y,
            comments.created_at,
            users.username
          FROM comments
          INNER JOIN users ON comments.user_id = users.id
          ORDER BY comments.created_at DESC
        `).all<CommentWithUser>();

        return Response.json({ comments: results });
      } catch (error) {
        console.error("Error fetching comments:", error);
        return Response.json(
          { error: "Failed to fetch comments" },
          { status: 500 }
        );
      }
    }

    if (pathname === "/api/comments" && request.method === "POST") {
      try {
        const body = await request.json() as {
          content: string;
          position_x: number;
          position_y: number;
        };

        if (!body.content || typeof body.position_x !== "number" || typeof body.position_y !== "number") {
          return Response.json(
            { error: "Invalid request body. Required: content, position_x, position_y" },
            { status: 400 }
          );
        }

        const ipAddress = getClientIP(request);
        const user = await getOrCreateUser(env.DB, ipAddress);

        const result = await env.DB
          .prepare(`
            INSERT INTO comments (user_id, content, position_x, position_y)
            VALUES (?, ?, ?, ?)
          `)
          .bind(user.id, body.content, body.position_x, body.position_y)
          .run();

        if (!result.success) {
          throw new Error("Failed to insert comment");
        }

        return Response.json(
          {
            id: result.meta.last_row_id,
            content: body.content,
            position_x: body.position_x,
            position_y: body.position_y,
            username: user.username,
            created_at: new Date().toISOString(),
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("Error creating comment:", error);
        return Response.json(
          { error: "Failed to create comment" },
          { status: 500 }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
