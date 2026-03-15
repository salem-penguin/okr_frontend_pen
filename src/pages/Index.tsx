import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageBackdrop } from "@/components/layout/PageBackdrop";

// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <PageBackdrop />
      <Card className="app-page-enter w-full max-w-2xl text-center">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome</CardTitle>
          <CardDescription className="text-base">
            Start building your project from this entry page.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
};

export default Index;
