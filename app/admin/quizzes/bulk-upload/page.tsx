import { getCurrentUser } from "@/lib/get-user"
import { redirect } from "next/navigation"
import { BulkUploadPage } from "@/components/admin/bulk-upload-page"

export default async function BulkUploadPageRoute() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin")
  }

  if (user.role !== "ADMIN") {
    redirect("/")
  }

  return <BulkUploadPage />
}
