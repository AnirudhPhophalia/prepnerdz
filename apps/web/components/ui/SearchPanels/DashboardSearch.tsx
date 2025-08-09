"use client"

import { useState, useEffect, JSX } from "react"
import axios from "axios"
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { Eye } from "@/icons/Eye";

import { Bookmark } from "@/icons/Bookmark"
// import { FiBookmark, FiDownload, FiEye, FiX } from "react-icons/fi"
import { ResourceModal } from "@/components/modals/ResourcePreview";

interface SearchPanelProps {
    activeNavItem: string;
}

interface Resource {
    id: string
    type: string
    title: string
    year: string
    month: string
    description: string
    fileUrl: string
    fileSize: number
    fileType: string
    subjectId: string
    uploadedById: string
    verified: boolean
    createdAt: string
    updatedAt: string
    subject?: {
        id: string
        subjectName: string
        subjectCode: string
        semesterId: string
        semester?: {
            id: string
            semNumber: number
            branchId: string
            branch?: {
                id: string
                branchName: string
            }
        }
    }
    uploadedBy?: {
        username: string
    }
};

// Mapping from nav item to API type
const typeMapping: Record<string, string> = {
    "shivani-books": "SHIVANI_BOOKS",
    "midsem-papers": "MID_SEM_PAPER",
    "endsem-papers": "END_SEM_PAPER",
    "imp-questions": "IMP_QUESTION",
    "imp-topics": "IMP_TOPIC",
    "best-notes": "NOTES",
    "syllabus": "SYLLABUS",
    "labmanual": "LAB_MANUAL",
}

// Configuration for different search panels
const searchPanelConfig = {
    "shivani-books": {
        title: "Search Shivani Books",
        description: "Find books by branch and semester",
        placeholder: "Search for books...",
        branches: ["CSE", "IOT", "AIML", "AIDS", "CSDS", "CSBS", "ME", "CE", "EX", "EE", "ECE"],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    "midsem-papers": {
        title: "Search Midsem Papers",
        description: "Find previous midsem papers by branch and semester",
        placeholder: "Search for midsem papers...",
        branches: ["CSE", "IOT", "AIML", "AIDS", "CSDS", "CSBS", "ME", "CE", "EX", "EE", "ECE"],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    "endsem-papers": {
        title: "Search Endsem Papers",
        description: "Find previous endsem papers by branch and semester",
        placeholder: "Search for endsem papers...",
        branches: ["CSE", "IOT", "AIML", "AIDS", "CSDS", "CSBS", "ME", "CE", "EX", "EE", "ECE"],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    "imp-questions": {
        title: "Search Important Questions",
        description: "Find important questions by branch and semester, subjects, units!",
        placeholder: "Search for important questions...",
        branches: ["CSE", "IOT", "AIML", "AIDS", "CSDS", "CSBS", "ME", "CE", "EX", "EE", "ECE"],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    "imp-topics": {
        title: "Search Important Topics",
        description: "Find important topics by branch and semester, subjects, units!",
        placeholder: "Search for important topics...",
        branches: ["CSE", "IOT", "AIML", "AIDS", "CSDS", "CSBS", "ME", "CE", "EX", "EE", "ECE"],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    "best-notes": {
        title: "Search Best Academic Notes",
        description: "Find best notes by subjects, units!",
        placeholder: "Search for notes...",
        branches: ["CSE", "IOT", "AIML", "AIDS", "CSDS", "CSBS", "ME", "CE", "EX", "EE", "ECE"],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    "syllabus": {
        title: "Search Syllabus",
        description: "Find Branch Syllabus",
        placeholder: "Search for Syllabus...",
        branches: ["CSE", "IOT", "AIML", "AIDS", "CSDS", "CSBS", "ME", "CE", "EX", "EE", "ECE"],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    "labmanual": {
        title: "Search Lab Manuals",
        description: "Find LabManuals and reading by subjects, units!",
        placeholder: "Search for labmanuals and its readings...",
        branches: ["CSE", "IOT", "AIML", "AIDS", "CSDS", "CSBS", "ME", "CE", "EX", "EE", "ECE"],
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    },
}

interface Bookmark {
    id: string;
    userId: string;
    resourceId: string;
    createdAt: string;
    resource: Resource;
}

interface BookmarksResponse {
    success: boolean;
    data: Bookmark[];
    count: number;
}

export default function SearchPanel({ activeNavItem }: SearchPanelProps): JSX.Element {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedBranch, setSelectedBranch] = useState("")
    const [selectedSemester, setSelectedSemester] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [resources, setResources] = useState<Resource[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)
    const [initialLoad, setInitialLoad] = useState(false)
    const [totalCount, setTotalCount] = useState(0)
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
    const [bookmarkedResourceIds, setBookmarkedResourceIds] = useState<string[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

    useEffect(() => {
        console.log("Welcome to PrepNerdz!")
    }, [totalCount])

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const sessionRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/user/session`, {
                    withCredentials: true
                });

                if (!sessionRes.data.message.isAuthenticated) return;

                const id = sessionRes.data.message.user.id;
                setUserId(id);

                const bookmarkRes = await axios.get<BookmarksResponse>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark/user/${id}`, {
                    withCredentials: true
                });

                // const ids = bookmarkRes.data.data.map((b: any) => b.resource.id);

                const ids = bookmarkRes.data.data
                    .filter((b) => b.resource && b.resource.id)
                    .map((b) => b.resource.id);

                setBookmarkedResourceIds(ids);
            } catch (error) {
                console.error("Failed to fetch bookmarks:", error);
            }
        };

        fetchBookmarks();
    }, []);



    // Get current panel configuration
    const currentPanel = searchPanelConfig[activeNavItem as keyof typeof searchPanelConfig]

    useEffect(() => {
        // Reset states when activeNavItem changes
        setSearchQuery("")
        setSelectedBranch("")
        setSelectedSemester("")
        setResources([])
        setPage(1)
        setHasMore(false)
        setInitialLoad(false)
    }, [activeNavItem])

    const fetchInitialResources = async () => {
        try {
            const type = typeMapping[activeNavItem]
            if (!type) return

            const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/resource`, {
                params: { type }
            })

            setResources(response.data.slice(0, 5)) // Show first 5 items initially
            setHasMore(response.data.length > 5)
            setInitialLoad(true)
        } catch (error) {
            toast.error("Failed to fetch initial resources")
            console.error("Error fetching initial resources:", error)
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim() || !selectedBranch || !selectedSemester) {
            toast.error("Please fill in all fields")
            return
        }

        setIsSearching(true)

        try {
            // Handle COMMON branch case
            const branchToUse = (selectedSemester === '1' || selectedSemester === '2' || selectedSemester === '4') ? "COMMON" : selectedBranch
            const semesterToUse = (selectedSemester === '1' || selectedSemester === '2') ? "0" : selectedSemester

            // First get branch ID
            const branchResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/getmyid/branchid`,
                { params: { branchName: branchToUse } }
            )

            // Then get semester ID
            const semesterResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/getmyid/semesterid`,
                { params: { semNumber: semesterToUse } }
            )

            const type = typeMapping[activeNavItem]
            if (!type) {
                toast.error("Invalid resource type")
                return
            }

            // Perform the search with pagination
            const searchResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/search`,
                {
                    params: {
                        type,
                        branch: branchResponse.data.branchId,
                        semester: semesterResponse.data.semesterId,
                        query: searchQuery,
                        page: 1,  // First page
                        limit: 5   // 5 items per page
                    }
                }
            )

            setResources(searchResponse.data.data)
            setTotalCount(searchResponse.data.total)
            setPage(1)
            setHasMore(searchResponse.data.hasMore)
        } catch (error) {
            toast.error("Search failed. Please try again.")
            console.error("Search error:", error)
        } finally {
            setIsSearching(false)
        }
    }

    const loadMoreResources = async () => {
        try {
            const nextPage = page + 1

            // Handle COMMON branch case
            const branchToUse = (selectedSemester === '1' || selectedSemester === '2' || selectedSemester === '4') ? "COMMON" : selectedBranch
            const semesterToUse = (selectedSemester === '1' || selectedSemester === '2') ? "0" : selectedSemester

            // Get IDs again in case they're needed
            const branchResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/getmyid/branchid`,
                { params: { branchName: branchToUse } }
            )

            const semesterResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/getmyid/semesterid`,
                { params: { semNumber: semesterToUse } }
            )

            const type = typeMapping[activeNavItem]
            const searchResponse = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/search`,
                {
                    params: {
                        type,
                        branch: branchResponse.data.branchId,
                        semester: semesterResponse.data.semesterId,
                        query: searchQuery,
                        page: nextPage,
                        limit: 5
                    }
                }
            )

            setResources(prev => [...prev, ...searchResponse.data.data])
            setPage(nextPage)
            setHasMore(searchResponse.data.hasMore)
        } catch (error) {
            toast.error("Failed to load more resources")
            console.error("Load more error:", error)
        }
    }

    const resetForm = () => {
        setSearchQuery("")
        setSelectedBranch("")
        setSelectedSemester("")
        setResources([])
        setPage(1)
        setHasMore(false)
        setInitialLoad(false)
    }

    const openModal = (resource: Resource) => {
        setSelectedResource(resource);
        setIsResourceModalOpen(true);
    };

    const handleBookmarkToggle = async (resourceId: string) => {
        if (!userId) {
            toast.error("Please log in to bookmark.");
            return;
        }

        const isBookmarked = bookmarkedResourceIds.includes(resourceId);

        try {
            if (isBookmarked) {
                // Unbookmark
                const res = await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark`, {
                    data: { userId, resourceId },
                    withCredentials: true
                });

                if (res.data.success) {
                    toast.success("Bookmark removed");
                    setBookmarkedResourceIds((prev) => prev.filter((id) => id !== resourceId));
                } else {
                    toast.error(res.data.message || "Failed to remove bookmark");
                }
            } else {
                // Bookmark
                const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/bookmark`, {
                    userId,
                    resourceId
                }, { withCredentials: true });

                if (res.data.success) {
                    toast.success("Bookmarked");
                    setBookmarkedResourceIds((prev) => [...prev, resourceId]);
                } else {
                    toast.error(res.data.message || "Failed to bookmark");
                }
            }
        } catch (error) {
            toast.error("Something went wrong!");
        }
    }

    // Load initial resources when panel is first rendered
    useEffect(() => {
        if (!initialLoad && currentPanel) {
            fetchInitialResources()
        }
    }, [activeNavItem, initialLoad, currentPanel])

    if (!currentPanel) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                    </svg>
                    <p className="text-lg">Its on the Way, Stay Tuned!</p>
                    <p className="text-lg">You will be notified!!</p>
                </div>
            </div>
        )
    }

        function formatFileSize(fileSize: number): import("react").ReactNode {
            if (!fileSize || fileSize < 0) return "N/A";
            const sizeInKb = fileSize / 1024;
            if (sizeInKb < 1024) {
            return `${sizeInKb.toFixed(1)} KB`;
            }
            return `${(sizeInKb / 1024).toFixed(2)} MB`;
        }

    return (
        <div className="bg-amber-50 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div>
                <ResourceModal
                    open={isResourceModalOpen}
                    onClose={() => setIsResourceModalOpen(false)}
                    resource={selectedResource}
                />
                {/* <ResourceModal
                    open={isResourceModalOpen}
                    onClose={() => setIsResourceModalOpen(false)}
                /> */}
            </div>

            {/* Panel Header */}
            <div className="flex justify-center items-center py-12">
                <div className="w-full max-w-3xl rounded-3xl bg-white/60 backdrop-blur-xl shadow-2xl border border-amber-200 p-10 flex flex-col gap-8 animate-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-amber-600 mb-2 drop-shadow-lg tracking-tight animate-in slide-in-from-top-4 duration-500">
                            {currentPanel.title}
                        </h1>
                        <p className="text-lg text-gray-700 font-medium animate-in slide-in-from-top-6 duration-700">
                            {currentPanel.description}
                        </p>
                    </div>
                    <form className="flex flex-col gap-6">
                        <div className="relative flex items-center gap-4">
                            <input
                                id="search"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={currentPanel.placeholder}
                                className="w-full px-6 py-5 rounded-2xl bg-white/70 backdrop-blur-lg shadow-lg border border-amber-300 focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200 pl-14 text-xl font-semibold placeholder-gray-400 hover:bg-white/80 hover:shadow-xl"
                            />
                            <motion.svg
                                initial={{ scale: 1 }}
                                whileHover={{ scale: 1.2, color: '#f59e0b' }}
                                className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-amber-400 pointer-events-none"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </motion.svg>
                            <button
                                type="button"
                                className="px-7 py-4 rounded-2xl bg-gradient-to-br from-amber-400 to-blue-400 text-white font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-200 text-lg"
                                onClick={() => {/* Optionally trigger search/filter logic here */}}
                            >
                                Search
                            </button>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                            <div className="flex flex-col gap-2 w-full md:w-1/2">
                                <label htmlFor="branch" className="block text-base font-semibold text-gray-700 mb-1">
                                    Branch
                                </label>
                                <select
                                    id="branch"
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value)}
                                    className="w-full px-5 py-4 rounded-full bg-white/80 border border-amber-300 shadow-md focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-lg font-semibold"
                                >
                                    <option value="">Select Branch</option>
                                    {currentPanel.branches.map((branch) => (
                                        <option key={branch} value={branch}>
                                            {branch}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-2 w-full md:w-1/2">
                                <label htmlFor="semester" className="block text-base font-semibold text-gray-700 mb-1">
                                    Semester
                                </label>
                                <select
                                    id="semester"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    className="w-full px-5 py-4 rounded-full bg-white/80 border border-amber-300 shadow-md focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-lg font-semibold"
                                >
                                    <option value="">Select Semester</option>
                                    {currentPanel.semesters.map((sem) => (
                                        <option key={sem} value={sem}>
                                            Semester {sem}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in slide-in-from-bottom-10 duration-1000">
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery.trim() || !selectedBranch || !selectedSemester}
                            className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center"
                        >
                            {isSearching ? (
                                <>
                                    <svg
                                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                    Search
                                </>
                            )}
                        </button>

                        <button
                            onClick={resetForm}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                            Reset
                        </button>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-4 mt-8">
                        {resources.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800">Results ({totalCount})</h3>
                                {resources.map((resource) => (
                                    <div key={resource.id} className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-sm md:text-lg text-blue-600">{resource.title}</h4>
                                                <p className="text-gray-600 mt-1 md:block hidden">{resource.description}</p>
                                                <div className="flex md:flex-wrap items-center mt-2 text-sm text-gray-500 gap-2">
                                                    {resource.subject?.subjectName && (
                                                        <span className="bg-gray-100 md:block hidden px-2 py-1 rounded">
                                                            {resource.subject.subjectName}
                                                        </span>
                                                    )}
                                                    {resource.subject?.subjectCode && (
                                                        <span className="bg-gray-100 px-2 py-1 rounded">
                                                            {resource.subject.subjectCode}
                                                        </span>
                                                    )}
                                                    <span className="bg-gray-100 px-2 w-20 text-center py-1 rounded">
                                                        {formatFileSize(resource.fileSize)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <Bookmark
                                                        onClick={() => handleBookmarkToggle(resource.id)}
                                                        className={`size-6 mx-4 cursor-pointer transition-colors duration-200 ${bookmarkedResourceIds.includes(resource.id)
                                                            ? 'text-blue-500 hover:text-gray-400'
                                                            : 'text-gray-400 hover:text-blue-500'
                                                            }`}
                                                    />
                                                </div>
                                                {/* <button
                                                    onClick={() => handleBookmark(resource.id)}
                                                    className="p-2 cursor-pointer text-gray-500 hover:text-amber-500 transition-colors"
                                                    aria-label="Bookmark"
                                                >
                                                    <Bookmark className="size-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(resource.fileUrl, resource.title)}
                                                    className="p-2 cursor-pointer text-gray-500 hover:text-green-600 transition-colors"
                                                    aria-label="Download"
                                                >
                                                    <Download className="size-5" />
                                                </button> */}
                                                {/* <Button
                                                    colorVariant="black_green"
                                                    sizeVariant="small"
                                                    text="View"
                                                    startIcon={<Eye className="size-5" />}
                                                    onClick={() => openModal(resource)}
                                                /> */}
                                                <div>
                                                    <Eye   
                                                        onClick={() => openModal(resource)}
                                                        className="cursor-pointer size-7"
                                                    />
                                                </div>

                                                {/* <button
                                                    onClick={() => setIsResourceModalOpen(true)}
                                                    className="p-2 cursor-pointer text-gray-500 hover:text-blue-600 transition-colors"
                                                    aria-label="View"
                                                >
                                                    <Eye className="size-5" />
                                                </button> */}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {hasMore && (
                                    <button
                                        onClick={loadMoreResources}
                                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span>Show More</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                        {resources.length === 0 && initialLoad && (
                            <div className="text-center py-8 text-gray-500">
                                <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <p>No resources found. Try a different search.</p>
                            </div>
                        )}
                    </div>
          </div>
    );
}
