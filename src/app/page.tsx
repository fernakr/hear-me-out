import Link from "next/link";
import Questionnaire from "@/components/Questionnaire";
// import { useState } from "react";

// import QRCodeGenerator from "@/components/QRCodeGenerator";


export default function Home() {

  
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Questionnaire />
      </div>
    
              
    </div>
  );
}
