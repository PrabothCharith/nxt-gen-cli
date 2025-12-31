export const exampleApiHandler = (orm: "prisma" | "drizzle" | "none") => `
import { NextResponse } from 'next/server';
${
  orm === "prisma"
    ? "import prisma from '@/lib/prisma';"
    : orm === "drizzle"
    ? "import { db } from '@/lib/db';\nimport { posts } from '@/db/schema';\nimport { like, or, desc } from 'drizzle-orm';"
    : "import { db } from '@/lib/db';"
}

export async function GET(request: Request) {
  ${
    orm === "prisma"
      ? `
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  const where = search
    ? {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ],
      }
    : {};

  const result = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });`
      : orm === "drizzle"
      ? `
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');

  const result = await db.select().from(posts).where(
    search 
      ? or(like(posts.title, \`%\${search}%\`), like(posts.content, \`%\${search}%\`))
      : undefined
  ).orderBy(desc(posts.createdAt));`
      : `
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  
  const where = search 
    ? {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ]
      }
    : undefined;

  const result = await db.post.findMany({ 
    where,
    orderBy: { createdAt: 'desc' }
  });`
  }
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  ${
    orm === "prisma"
      ? "const post = await prisma.post.create({ data: { title: body.title, content: body.content } });"
      : orm === "drizzle"
      ? "const post = await db.insert(posts).values({ title: body.title, content: body.content }).returning();"
      : "const post = await db.post.create({ data: { title: body.title, content: body.content } });"
  }
  return NextResponse.json(${orm === "drizzle" ? "post[0]" : "post"});
}
`;

export const exampleApiIdHandler = (orm: "prisma" | "drizzle" | "none") => `
import { NextResponse } from 'next/server';
${
  orm === "prisma"
    ? "import prisma from '@/lib/prisma';"
    : orm === "drizzle"
    ? "import { db } from '@/lib/db';\nimport { posts } from '@/db/schema';\nimport { eq } from 'drizzle-orm';"
    : "import { db } from '@/lib/db';"
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const { id } = await params;
  const postId = Number(id);
  const body = await request.json();

  try {
    ${
      orm === "prisma"
        ? `const post = await prisma.post.update({
      where: { id: postId },
      data: { title: body.title, content: body.content },
    });`
        : orm === "drizzle"
        ? `const post = await db.update(posts)
        .set({ title: body.title, content: body.content })
        .where(eq(posts.id, postId))
        .returning();`
        : `const post = await db.post.update({
      where: { id: postId },
      data: { title: body.title, content: body.content },
    });`
    }
    return NextResponse.json(${orm === "drizzle" ? "post[0]" : "post"});
  } catch (error) {
    return NextResponse.json({ error: 'Post not found or update failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
   const { id } = await params;
   const postId = Number(id);

  try {
    ${
      orm === "prisma"
        ? `await prisma.post.delete({
      where: { id: postId },
    });`
        : orm === "drizzle"
        ? `await db.delete(posts).where(eq(posts.id, postId));`
        : `await db.post.delete({
      where: { id: postId },
    });`
    }
    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Post not found or delete failed' }, { status: 500 });
  }
}
`;

export const examplePage = (hasQuery: boolean, hasAxios: boolean) => `
'use client';

import { useState, useEffect } from "react";
${
  hasQuery
    ? 'import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";'
    : ""
}
${hasAxios ? 'import { api } from "@/lib/axios";' : ""}

// --- Icons (Simple SVG icons for zero-dep) ---
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);

interface Post {
  id: number;
  title: string;
  content: string | null;
  createdAt: string;
}

interface InsertPost {
  title: string;
  content: string;
}

export default function PostsPage() {
  const [modalMode, setModalMode] = useState<"create" | "edit" | "delete" | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  ${
    hasQuery
      ? `
  const queryClient = useQueryClient();

  // Queries & Mutations
  const { data: posts, isLoading } = useQuery({
    queryKey: ["posts", debouncedSearch],
    queryFn: async () => {
      ${
        hasAxios
          ? "const res = await api.get(`/posts?search=${debouncedSearch}`); return res.data;"
          : "const res = await fetch(`/api/posts?search=${debouncedSearch}`); return res.json();"
      }
    },
  });

  const postAddMutation = useMutation({
    mutationFn: async (newPost: InsertPost) => {
        ${
          hasAxios
            ? 'return api.post("/posts", newPost);'
            : 'return fetch("/api/posts", { method: "POST", body: JSON.stringify(newPost) });'
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        closeModal();
    },
  });

  const postUpdateMutation = useMutation({
    mutationFn: async (updatedPost: Post) => {
        ${
          hasAxios
            ? "return api.put(`/posts/${updatedPost.id}`, updatedPost);"
            : 'return fetch(`/api/posts/${updatedPost.id}`, { method: "PUT", body: JSON.stringify(updatedPost) });'
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        closeModal();
    },
  });

  const postDeleteMutation = useMutation({
    mutationFn: async (postId: number) => {
         ${
           hasAxios
             ? "return api.delete(`/posts/${postId}`);"
             : 'return fetch(`/api/posts/${postId}`, { method: "DELETE" });'
         }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        closeModal();
    },
  });
  `
      : `
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        ${
          hasAxios
            ? "const res = await api.get(`/posts?search=${debouncedSearch}`); setPosts(res.data);"
            : "const res = await fetch(`/api/posts?search=${debouncedSearch}`); const data = await res.json(); setPosts(data);"
        }
      } catch (error) {
        console.error("Failed to fetch posts", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [debouncedSearch]);

   const handleAdd = async (newPost: InsertPost) => {
      setIsMutating(true);
      try {
         ${
           hasAxios
             ? 'await api.post("/posts", newPost);'
             : 'await fetch("/api/posts", { method: "POST", body: JSON.stringify(newPost) });'
         }
         window.location.reload(); // Simple refresh for no-query
      } finally {
        setIsMutating(false);
      }
   };

   const handleUpdate = async (updatedPost: Post) => {
      setIsMutating(true);
      try {
          ${
            hasAxios
              ? "await api.put(`/posts/${updatedPost.id}`, updatedPost);"
              : 'await fetch(`/api/posts/${updatedPost.id}`, { method: "PUT", body: JSON.stringify(updatedPost) });'
          }
         window.location.reload();
      } finally {
        setIsMutating(false);
      }
   };

   const handleDeletePost = async (postId: number) => {
      setIsMutating(true);
      try {
          ${
            hasAxios
              ? "await api.delete(`/posts/${postId}`);"
              : 'await fetch(`/api/posts/${postId}`, { method: "DELETE" });'
          }
         window.location.reload();
      } finally {
         setIsMutating(false);
      }
   };
  `
  }

  // Handlers
  const openCreateModal = () => {
      setTitle("");
      setContent("");
      setModalMode("create");
  };

  const openEditModal = (post: Post) => {
      setSelectedPost(post);
      setTitle(post.title);
      setContent(post.content || "");
      setModalMode("edit");
  };

  const openDeleteModal = (post: Post) => {
      setSelectedPost(post);
      setModalMode("delete");
  };

  const closeModal = () => {
      setModalMode(null);
      setSelectedPost(null);
      setTitle("");
      setContent("");
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (modalMode === "create") {
          ${
            hasQuery
              ? "postAddMutation.mutate({ title, content });"
              : "handleAdd({ title, content });"
          }
      } else if (modalMode === "edit" && selectedPost) {
           ${
             hasQuery
               ? "postUpdateMutation.mutate({ ...selectedPost, title, content });"
               : "handleUpdate({ ...selectedPost, title, content });"
           }
      }
  };

  const handleDelete = () => {
      if (selectedPost) {
           ${
             hasQuery
               ? "postDeleteMutation.mutate(selectedPost.id);"
               : "handleDeletePost(selectedPost.id);"
           }
      }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8 font-sans text-neutral-900">
      {/* Background Gradient Blob */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-100/50 to-transparent -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 pb-2">
                Thoughts & Ideas
            </h1>
            <p className="text-neutral-500">Share your creativity with the world.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative group w-full md:w-64">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-blue-500 transition-colors">
                    <SearchIcon />
                </div>
                <input 
                    type="text" 
                    placeholder="Search posts..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/50 backdrop-blur-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm group-hover:shadow-md"
                />
            </div>

            <button 
                onClick={openCreateModal}
                className="flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-xl hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-neutral-900/20 font-medium"
            >
                <PlusIcon />
                <span>Create</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
        )}

        {/* Empty State */}
        {!isLoading && posts?.length === 0 && (
             <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4 text-neutral-400">
                    <SearchIcon />
                </div>
                <h3 className="text-xl font-semibold text-neutral-700">No posts found</h3>
                <p className="text-neutral-500 max-w-sm mx-auto mt-2">Try adjusting your search or create a new post to get started.</p>
             </div>
        )}

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {!isLoading && posts?.map((post: Post) => (
                <div 
                    key={post.id} 
                    className="group relative bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
                >
                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 bg-white/80 backdrop-blur rounded-lg p-1 shadow-sm border border-neutral-100">
                        <button 
                            onClick={() => openEditModal(post)}
                            className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Edit"
                        >
                            <EditIcon />
                        </button>
                        <button 
                            onClick={() => openDeleteModal(post)}
                            className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete"
                        >
                            <TrashIcon />
                        </button>
                    </div>

                    <div className="flex-grow">
                        <small className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 block">
                            Post #{post.id}
                        </small>
                        <h2 className="text-lg font-bold text-neutral-800 mb-2 leading-tight line-clamp-2">
                            {post.title}
                        </h2>
                        <p className="text-neutral-500 text-sm line-clamp-3 leading-relaxed">
                            {post.content}
                        </p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                        <small className="text-xs text-neutral-400 font-medium">
                            {new Date(post.createdAt || Date.now()).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </small>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Modals Overlay */}
      {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/20 backdrop-blur-sm animate-in fade-in duration-200">
              
              {/* Edit/Create Modal */}
              {(modalMode === "create" || modalMode === "edit") && (
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="p-6 border-b border-neutral-100">
                        <h2 className="text-xl font-bold text-neutral-800">
                            {modalMode === "create" ? "Create New Post" : "Edit Post"}
                        </h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700 ml-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a catchy title..."
                                className="w-full text-lg font-medium placeholder:font-normal placeholder:text-neutral-400 border-none bg-neutral-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-neutral-700 ml-1">Content</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What's on your mind?"
                                className="w-full h-32 resize-none placeholder:text-neutral-400 border-none bg-neutral-50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                            />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex-1 px-4 py-3 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={${
                                  hasQuery
                                    ? "postAddMutation.isPending || postUpdateMutation.isPending"
                                    : "isMutating"
                                }}
                                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center cursor-pointer"
                            >
                                {(${
                                  hasQuery
                                    ? "postAddMutation.isPending || postUpdateMutation.isPending"
                                    : "isMutating"
                                }) ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    modalMode === "create" ? "Create Post" : "Save Changes"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
              )}

              {/* Delete Modal */}
              {modalMode === "delete" && (
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                      <div className="p-8 text-center">
                          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                              <TrashIcon />
                          </div>
                          <h2 className="text-xl font-bold text-neutral-800 mb-2">Delete Post?</h2>
                          <p className="text-neutral-500 mb-8">
                              Are you sure you want to delete <span className="font-semibold text-neutral-800">&apos;{selectedPost?.title}&apos;</span>? This action cannot be undone.
                          </p>
                          <div className="flex gap-3">
                              <button
                                  type="button"
                                  onClick={closeModal}
                                  className="flex-1 px-4 py-3 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors cursor-pointer"
                              >
                                  Cancel
                              </button>
                              <button
                                  type="button"
                                  onClick={handleDelete}
                                  disabled={${
                                    hasQuery
                                      ? "postDeleteMutation.isPending"
                                      : "isMutating"
                                  }}
                                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 flex justify-center items-center cursor-pointer"
                              >
                                   {${
                                     hasQuery
                                       ? "postDeleteMutation.isPending"
                                       : "isMutating"
                                   } ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Delete"
                                )}
                              </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
`;

export const hubPage = `
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-gray-50 to-white dark:from-black dark:to-gray-900 dark:text-white">
      <div className="text-center mb-16 max-w-2xl">
        <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Welcome to Your App
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Your project is ready. Select an example below to get started.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Auth Card */}
        <Link href="/auth" className="group">
          <div className="p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all hover:border-blue-500 bg-white dark:bg-gray-800/50">
            <h2 className="text-2xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
              Authentication &rarr;
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Complete user authentication flow with server-side sessions, protected routes, and user profiles.
            </p>
          </div>
        </Link>

        {/* CRUD Card */}
        <Link href="/posts" className="group">
          <div className="p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-xl transition-all hover:border-purple-500 bg-white dark:bg-gray-800/50">
            <h2 className="text-2xl font-semibold mb-3 group-hover:text-purple-600 transition-colors">
              CRUD Operations &rarr;
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Full-stack Create, Read, Update, Delete functionality with database integration and API routes.
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-16 text-center text-sm text-gray-500">
        <p>Generated by nxt-gen-cli</p>
      </div>
    </main>
  );
}
`;
