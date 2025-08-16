'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: 'What is this application built with?',
      answer: 'This application is built with Next.js 15, TypeScript, Tailwind CSS, and Supabase for authentication and database management.'
    },
    {
      question: 'How does authentication work?',
      answer: 'We use Supabase Auth which provides secure authentication. Users can sign up with email/password or use Google OAuth for quick access.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, all data is encrypted in transit and at rest. We use Supabase\'s row-level security to ensure users can only access their own data.'
    },
    {
      question: 'Can I use this as a starter template?',
      answer: 'Absolutely! This project is designed to be a solid foundation for building full-stack applications with modern technologies.'
    },
    {
      question: 'How do I get started?',
      answer: 'Simply sign up for an account using your email or Google account, and you\'ll have access to the dashboard where you can start using the application.'
    },
    {
      question: 'What kind of support is available?',
      answer: 'We offer different levels of support based on your plan. Free users get community support, Pro users get priority support, and Enterprise users get dedicated support.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold">My App</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/features" className="text-gray-700 hover:text-gray-900">Features</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-gray-900">Pricing</Link>
              <Link href="/faq" className="text-blue-600 font-medium">FAQ</Link>
              <Link href="/contact" className="text-gray-700 hover:text-gray-900">Contact</Link>
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Sign In</Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-center mb-12">Frequently Asked Questions</h1>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md">
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <Link href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
            Contact our support team
          </Link>
        </div>
      </main>
    </div>
  )
}