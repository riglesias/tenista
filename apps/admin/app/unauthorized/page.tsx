import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You do not have permission to access the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This area is restricted to administrators only. If you believe you should have access, please contact your system administrator.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">
              Return to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}