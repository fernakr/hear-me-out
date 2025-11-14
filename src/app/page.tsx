import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center text-md md:text-xl lg:text-2xl content-container">
      <h1 className="mb-3 font-bold">This experience requires introspection and vulnerability.<br /> If you are willing to take this on, proceed.</h1>
      <Link
        href="/questionnaire"
        className="inline-block underline hover:no-underline"
      >
        I am ready &#8594;
      </Link>
    </div>
  );
}
