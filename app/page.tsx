"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Show = {
  id: string
  name: string
  casual_description: string
  first_aired: string
  image: string
}

export default function Home() {
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [shows, setShows] = useState<Show[]>([])

  const handleSubmit = async () => {
    if (!description.trim()) return
    
    setIsLoading(true)
    setShows([])
    
    try {
      const response = await fetch("/api/tv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      })
      
      const data = await response.json()
      if (data.results) {
        setShows(data.results)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center">
      <main className="w-full max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto px-4 py-8">
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-7xl sm:text-6xl font-semibold tracking-tight text-white">
            binge next.
          </h1>
          <p className="text-base sm:text-lg text-zinc-400">
            half-remembered plot? weirdly specific scene?
          </p>
          <p className="text-base sm:text-lg text-zinc-400">
            that show with the guy who does the thing? yeah, i&apos;ll find it.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="relative w-full max-w-xl">
            <Input
              placeholder="tell me what you're looking for..."
              className="w-full bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 pr-12"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <Button 
              className="absolute right-0 top-0 h-full px-3 bg-transparent hover:bg-zinc-700"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="rounded-full h-4 w-4 border-2 border-zinc-400 border-t-transparent animate-spin" />
              ) : (
                <SearchIcon className="h-4 w-4 text-zinc-400" />
              )}
            </Button>
          </div>
        </div>

        {shows.length > 0 && (
          <div className="grid gap-4 sm:gap-6">
            {shows.map((show) => (
              <div key={show.id} className="bg-zinc-900/50 rounded-lg p-4 sm:p-6 backdrop-blur">
                <div className="flex gap-4 sm:gap-6">
                  {show.image && (
                    <img 
                      src={show.image}
                      alt={show.name}
                      className="w-20 sm:w-24 h-28 sm:h-36 object-cover rounded-md shadow-lg"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h2 className="text-lg sm:text-xl font-medium text-white">{show.name}</h2>
                      <p className="text-xs sm:text-sm text-zinc-400">
                      {new Date(show.first_aired).getFullYear()}
                      </p>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                      {show.casual_description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

const SearchIcon = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)