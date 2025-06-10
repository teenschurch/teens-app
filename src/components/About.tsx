import { Heart, Users, Zap, Star } from "lucide-react"

export default function About() {
  const features = [
    {
      icon: Heart,
      title: "Faith-Centered",
      description: "Everything we do is rooted in God's love and biblical truth",
    },
    {
      icon: Users,
      title: "Community",
      description: "Build lasting friendships with teens who share your values",
    },
    {
      icon: Zap,
      title: "High Energy",
      description: "Worship, games, and activities that keep you engaged",
    },
    {
      icon: Star,
      title: "Personal Growth",
      description: "Discover your purpose and grow in your relationship with God",
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Teen Church?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We're more than just a youth group - we're a family where teens can grow, learn, and have fun while
              building their relationship with God.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Ready to Join Us?</h3>
              <p className="text-lg text-gray-600 mb-6">
                Come as you are! We meet every Sunday at 6 PM for worship, fellowship, and fun activities designed just
                for teens.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <p className="font-semibold text-gray-800">When:</p>
                  <p className="text-gray-600">Sundays at 6:00 PM</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <p className="font-semibold text-gray-800">Ages:</p>
                  <p className="text-gray-600">13-18 years old</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-md">
                  <p className="font-semibold text-gray-800">What to Bring:</p>
                  <p className="text-gray-600">Just yourself!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
