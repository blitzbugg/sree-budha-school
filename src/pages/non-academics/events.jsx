import React, { useEffect, useState, useRef } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// Scroll-reveal component
function Reveal({
  children,
  className = "",
  delay = 0,
  threshold = 0.15,
  from = "up",
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  const hiddenTransform =
    from === "left"
      ? "-translate-x-6"
      : from === "right"
      ? "translate-x-6"
      : from === "down"
      ? "-translate-y-6"
      : "translate-y-6";
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${hiddenTransform}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Media Thumbnail Component - Handles both images and videos
const MediaThumbnail = ({ media, title, onClick }) => {
  if (!media) return null;

  const isVideo = media.mimeType?.startsWith("video/");

  if (isVideo) {
    return (
      <div
        className="relative w-full h-full bg-black cursor-pointer group/video"
        onClick={onClick}
      >
        <video
          className="w-full h-full object-cover transition-transform duration-500 group-hover/video:scale-105"
          muted
          playsInline
          preload="metadata"
        >
          <source src={media.url} type={media.mimeType} />
          Your browser does not support the video tag.
        </video>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/video:bg-black/30 transition-colors duration-300">
          <div className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-xl transform group-hover/video:scale-110 transition-all duration-300 ring-4 ring-white/20">
            <svg
              className="w-7 h-7 text-blue-600 ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Image display
  return (
    <img
      src={media.url}
      alt={media.alt || title}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
      onClick={onClick}
    />
  );
};

// Media Modal/Lightbox Component
const MediaModal = ({ media, onClose }) => {
  if (!media) return null;

  const isVideo = media.mimeType?.startsWith("video/");

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            controls
            autoPlay
            className="w-full h-auto max-h-[85vh]"
            controlsList="nodownload"
          >
            <source src={media.url} type={media.mimeType} />
            Your browser does not support the video tag.
          </video>
        ) : (
          <img
            src={media.url}
            alt={media.alt || "Media"}
            className="w-full h-auto max-h-[85vh] object-contain"
          />
        )}

        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-white bg-black/60 hover:bg-black/80 rounded-full p-2.5 transition-colors duration-200 w-11 h-11 flex items-center justify-center backdrop-blur-sm"
          onClick={onClose}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Optional: Media info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
          <p className="text-sm font-medium">
            {isVideo ? "🎬 Video" : "📸 Image"}
            {media.alt && ` — ${media.alt}`}
          </p>
        </div>
      </div>
    </div>
  );
};

const EventsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_CMS_URL}/api/events`);
        if (!res.ok) throw new Error("Failed to fetch events");
        const result = await res.json();
        const docs = result?.docs || [];

        const events = docs.map((ev) => {
          const media = ev.images || ev.media || null;

          return {
            id: ev.id ?? ev._id ?? String(Math.random()).slice(2),
            title: ev.title,
            category: (ev.category || "").toLowerCase(),
            publishDate: ev.publishDate || ev.updatedAt || ev.createdAt,
            date: ev.publishDate
              ? new Date(ev.publishDate).toLocaleDateString()
              : ev.date || "",
            year: ev.publishDate
              ? String(new Date(ev.publishDate).getFullYear())
              : ev.year || "",
            description: ev.content || ev.description || "",
            media: media,
            coverImage: media?.url || ev.coverImage || null,
            mediaType: media?.mimeType?.startsWith("video/") ? "video" : "image",
            photoCount: ev.photoCount || 0,
            videoCount: ev.videoCount || 0,
          };
        });

        const yearsSet = new Set(events.map((e) => e.year).filter(Boolean));
        const years = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
        const categoryIcons = {
          cultural: "🎭",
          sports: "⚽",
          celebration: "🎉",
          academic: "📚",
        };
        const categoriesSet = new Map();
        events.forEach((e) => {
          const id = e.category || "other";
          if (!categoriesSet.has(id)) {
            categoriesSet.set(id, {
              id,
              name:
                id === "other"
                  ? "Other"
                  : id.charAt(0).toUpperCase() + id.slice(1),
              icon: categoryIcons[id] || "🎯",
            });
          }
        });
        const categories = [
          { id: "all", name: "All Events", icon: "🎯" },
          ...Array.from(categoriesSet.values()),
        ];

        const dataObj = {
          title: "School Events",
          subtitle:
            "A Visual Journey Through Our Memorable Celebrations and Activities",
          years: years.length ? years : ["2024"],
          categories,
          events,
        };
        setData(dataObj);
        if (years.length) setSelectedYear(years[0]);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEvents = data?.events?.filter(
    (event) =>
      (selectedCategory === "all" || event.category === selectedCategory) &&
      event.year === selectedYear
  );

  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-16 lg:py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 rounded-full translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500 rounded-full -translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-sky-400 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          {loading ? (
            <>
              <Skeleton
                height={8}
                width={120}
                className="mx-auto mb-6 rounded-full"
                baseColor="#f3f4f6"
                highlightColor="#e5e7eb"
              />
              <Skeleton
                height={48}
                width={400}
                className="mx-auto mb-6"
                baseColor="#f3f4f6"
                highlightColor="#e5e7eb"
              />
              <Skeleton
                height={24}
                width={600}
                className="mx-auto"
                baseColor="#f3f4f6"
                highlightColor="#e5e7eb"
                count={2}
              />
            </>
          ) : error ? (
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-red-100 rounded-full border border-red-200 mb-6">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                <span className="text-red-600 font-semibold text-sm tracking-wide">
                  ERROR
                </span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Unable to Load Content
              </h2>
              <p className="text-lg text-red-600">{error}</p>
            </div>
          ) : (
            <>
              <Reveal>
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full border border-blue-300 mb-6">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold text-sm tracking-wide">
                    EVENT GALLERY
                  </span>
                </div>
              </Reveal>
              <Reveal delay={100}>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  School{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent">
                    Events
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={200}>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  {data?.subtitle}
                </p>
              </Reveal>
            </>
          )}
        </div>

        {/* Year and Category Filters */}
        {!loading && !error && (
          <div className="mb-12">
            <Reveal delay={300}>
              <div className="flex justify-center gap-3 mb-6 flex-wrap">
                {data?.years?.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${
                      selectedYear === year
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
                        : "bg-white text-gray-700 hover:bg-blue-50 shadow-md hover:shadow-lg"
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </Reveal>

            <Reveal delay={400}>
              <div className="flex flex-wrap justify-center gap-3">
                {data?.categories?.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-5 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
                        : "bg-white text-gray-700 hover:bg-blue-50 shadow-md hover:shadow-lg"
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </Reveal>
          </div>
        )}

        {/* Events Grid */}
        {!loading && !error && filteredEvents && (
          <div className="mb-20">
            {filteredEvents.length === 0 ? (
              <Reveal delay={500}>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No Events Found
                  </h3>
                  <p className="text-gray-600">
                    Try selecting a different category or year
                  </p>
                </div>
              </Reveal>
            ) : (
              <>
                <Reveal delay={500}>
                  <div className="text-center mb-8">
                    <p className="text-lg text-gray-600">
                      Showing{" "}
                      <span className="font-bold text-blue-600">
                        {filteredEvents.length}
                      </span>{" "}
                      events
                    </p>
                  </div>
                </Reveal>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredEvents.map((event, index) => (
                    <Reveal key={event.id} delay={600 + index * 50}>
                      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100/80 group flex flex-col h-full">
                        {/* Media Area */}
                        <div className="relative h-56 overflow-hidden bg-gray-100">
                          {event.media ? (
                            <MediaThumbnail
                              media={event.media}
                              title={event.title}
                              onClick={() => setSelectedMedia(event.media)}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                              <span className="text-4xl opacity-60">📸</span>
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none"></div>

                          {/* Category Badge */}
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg tracking-wide">
                            {event.category.charAt(0).toUpperCase() +
                              event.category.slice(1)}
                          </div>

                          {/* Media Type Badge */}
                          {event.mediaType === "video" && (
                            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                              <span className="text-[10px]">▶</span> VIDEO
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                            <span className="text-purple-600">📅</span>
                            <span className="font-medium">{event.date}</span>
                          </div>

                          <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-snug">
                            {event.title}
                          </h4>

                          <p className="text-sm text-gray-600 leading-relaxed mb-5 line-clamp-3 flex-grow">
                            {event.description?.split("\n").map((line, i, arr) => (
                              <React.Fragment key={i}>
                                {line}
                                {i < arr.length - 1 && <br />}
                              </React.Fragment>
                            ))}
                          </p>

                          {/* View / Play Button */}
                          {event.media && (
                            <button
                              onClick={() => setSelectedMedia(event.media)}
                              className="mt-auto w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-2.5 px-4 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group/btn"
                            >
                              <span>
                                {event.mediaType === "video"
                                  ? "▶ Play Video"
                                  : "📸 View Image"}
                              </span>
                              <svg
                                className="w-4 h-4 transform group-hover/btn:translate-x-0.5 transition-transform"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Call to Action */}
        <Reveal delay={1000}>
          <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 rounded-2xl p-8 lg:p-12 shadow-2xl text-center">
            <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Stay Updated with Our Events
            </h3>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Follow us on social media and subscribe to our newsletter for the
              latest updates on school events and activities
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300">
                Subscribe to Newsletter
              </button>
              <button className="bg-blue-700 text-white font-bold px-8 py-4 rounded-xl hover:bg-blue-800 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1 duration-300">
                Follow on Social Media
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Media Modal */}
      {selectedMedia && (
        <MediaModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
      <div
        className="absolute top-32 right-20 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-20 left-20 w-4 h-4 bg-sky-400 rounded-full animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute bottom-40 right-32 w-3 h-3 bg-blue-600 rounded-full animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>
      <div
        className="absolute top-1/2 left-32 w-2 h-2 bg-cyan-500 rounded-full animate-pulse"
        style={{ animationDelay: "0.5s" }}
      ></div>
    </div>
  );
};

export default EventsPage;