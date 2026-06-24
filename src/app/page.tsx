import { Dashboard } from "@/components/Dashboard";

type PageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;

  return <Dashboard initialToken={params.token ?? ""} />;
}
