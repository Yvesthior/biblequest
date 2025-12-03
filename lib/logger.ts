import { prisma } from "@/lib/prisma"

interface LogErrorOptions {
  error: any
  context?: Record<string, any>
}

export async function logError({ error, context }: LogErrorOptions) {
  try {
    // Ensure we have a proper error message
    const message = error instanceof Error ? error.message : "An unknown error occurred"
    
    // Ensure we have a stack trace if possible
    const stack = error instanceof Error ? error.stack : undefined

    await prisma.errorLog.create({
      data: {
        message,
        stack: stack,
        route: context?.route,
        // You could add more context here, like user ID, etc.
        // context: JSON.stringify(context) 
      },
    })

    console.log("✅ Error successfully logged to database.")
  } catch (loggingError) {
    // If logging to the database fails, log to the console as a fallback.
    console.error("❌ Failed to log error to database:", loggingError)
    console.error("Original error:", error)
  }
}
