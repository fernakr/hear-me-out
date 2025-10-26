import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center">        
        <p className="mb-3">This experience requires introspection and vulnerability. If you are willing to take this on, proceed.</p>
          <Link 
              href="/questionnaire"
              className="inline-block underline hover:no-underline"
            >
              I'm Ready
            </Link>
    </div>
  );
}
