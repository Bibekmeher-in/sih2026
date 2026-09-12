"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  Plus,
  Heart,
  CornerDownRight,
  TrendingUp,
  AlertCircle,
  Clock,
  Pin,
  Send,
  Loader2,
  X,
  MapPin,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";
import { VoiceInputButton } from "@/components/shared/voice-input-button";
import { VoiceReadoutButton } from "@/components/shared/voice-readout-button";

interface CommunityPostItem {
  _id: string;
  groupId?: string | null;
  groupName?: string | null;
  authorId: string;
  authorName: string;
  authorRole: string;
  title?: string;
  content: string;
  postType: string;
  productName?: string;
  marketPriceDetails?: {
    crop: string;
    pricePerKg: number;
    marketName: string;
    location: string;
    reportedDate: string;
  };
  likes: string[];
  likesCount: number;
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
}

interface FpoCommunityFeedProps {
  currentUserId: string;
  activeGroupId?: string;
  groupsList: Array<{ id: string; name: string; product: string }>;
}

export function FpoCommunityFeed({
  currentUserId,
  activeGroupId,
  groupsList,
}: FpoCommunityFeedProps) {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>(activeGroupId || "");

  // Create Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postType, setPostType] = useState("GENERAL");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postGroupId, setPostGroupId] = useState(selectedGroup || (groupsList[0]?.id || ""));
  const [marketCrop, setMarketCrop] = useState("");
  const [marketPrice, setMarketPrice] = useState("");
  const [marketName, setMarketName] = useState("");
  const [marketLocation, setMarketLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments Thread State
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<
    Array<{
      _id: string;
      authorName: string;
      authorRole: string;
      content: string;
      createdAt: string;
      parentCommentId?: string | null;
    }>
  >([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // AI Discussion Summary State
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [aiSummaryResult, setAiSummaryResult] = useState<{
    summary: string;
    bullets: string[];
    isAiGenerated: boolean;
    groupName: string;
    cropName: string;
  } | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [activeFilter, selectedGroup]);

  async function fetchPosts() {
    setLoading(true);
    try {
      let url = `/api/fpo/posts?limit=30`;
      if (selectedGroup) url += `&groupId=${selectedGroup}`;
      if (activeFilter !== "ALL") url += `&postType=${activeFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Failed to load posts:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLikeToggle(postId: string) {
    try {
      const res = await fetch(`/api/fpo/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p._id === postId) {
              const hasLiked = p.likes.includes(currentUserId);
              const newLikes = hasLiked
                ? p.likes.filter((id) => id !== currentUserId)
                : [...p.likes, currentUserId];
              return {
                ...p,
                likes: newLikes,
                likesCount: data.likesCount,
              };
            }
            return p;
          })
        );
      }
    } catch (e) {
      console.error("Failed to like post:", e);
    }
  }

  async function handleOpenComments(postId: string) {
    if (expandedCommentsPostId === postId) {
      setExpandedCommentsPostId(null);
      return;
    }
    setExpandedCommentsPostId(postId);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/fpo/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success && data.comments) {
        setComments(data.comments);
      }
    } catch (e) {
      console.error("Failed to fetch comments:", e);
    } finally {
      setLoadingComments(false);
    }
  }

  async function handleAddComment(postId: string) {
    if (!newCommentText.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/fpo/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newCommentText.trim(),
          parentCommentId: replyingToCommentId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setNewCommentText("");
        setReplyingToCommentId(null);
        setPosts((prev) =>
          prev.map((p) => (p._id === postId ? { ...p, commentCount: p.commentCount + 1 } : p))
        );
      }
    } catch (e) {
      console.error("Failed to post comment:", e);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        groupId: postGroupId,
        postType,
        title: postTitle.trim(),
        content: postContent.trim(),
      };

      if (postType === "MARKET_PRICE" && marketPrice && marketCrop) {
        payload.marketPriceDetails = {
          crop: marketCrop.trim(),
          pricePerKg: Number(marketPrice),
          marketName: marketName.trim() || "Local Mandi",
          location: marketLocation.trim() || "Odisha",
          reportedDate: "Today",
        };
        payload.productName = marketCrop.trim();
      }

      const res = await fetch("/api/fpo/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.post) {
        setShowCreateModal(false);
        setPostTitle("");
        setPostContent("");
        setMarketCrop("");
        setMarketPrice("");
        setMarketName("");
        setMarketLocation("");
        fetchPosts();
      }
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGenerateAiSummary() {
    setLoadingAiSummary(true);
    setShowAiSummaryModal(true);
    try {
      const res = await fetch("/api/fpo/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroup || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSummaryResult({
          summary: data.summary,
          bullets: data.bullets || [],
          isAiGenerated: data.isAiGenerated,
          groupName: data.groupName,
          cropName: data.cropName,
        });
      }
    } catch (e) {
      console.error("AI summary error:", e);
    } finally {
      setLoadingAiSummary(false);
    }
  }

  const filterOptions = [
    { label: "All Discussions", value: "ALL" },
    { label: "Market Prices", value: "MARKET_PRICE" },
    { label: "Farming Tips", value: "FARMING_TIPS" },
    { label: "Problems & Pest Alerts", value: "PROBLEM" },
    { label: "Bulk Selling", value: "BULK_SELLING" },
    { label: "Buyer Demand", value: "DEMAND" },
    { label: "Announcements", value: "ANNOUNCEMENT" },
  ];

  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.authorName.toLowerCase().includes(q) ||
      p.productName?.toLowerCase().includes(q) ||
      p.marketPriceDetails?.marketName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("fpoCommunity.searchPlaceholder", "Search discussions, crop prices, pest tips...")}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-10 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <VoiceInputButton onTranscript={(txt) => setSearchQuery(txt)} size="sm" />
            </div>
          </div>

          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          >
            <option value="">All Groups</option>
            {groupsList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.product})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGenerateAiSummary}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-purple-700" />
            <span>AI Discussion Summary</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Start Discussion / Report Price</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={`px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer ${
              activeFilter === opt.value
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
          <span>Loading farmer community discussions...</span>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">No discussions match your filter</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Be the first farmer to share a harvest update, report today&apos;s Mandi price, or ask a question.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-medium text-xs hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            Start First Discussion
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const isLiked = post.likes?.includes(currentUserId);
            const isExpanded = expandedCommentsPostId === post._id;

            return (
              <div
                key={post._id}
                className={`rounded-2xl bg-white border ${
                  post.isPinned ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
                } shadow-xs p-5 space-y-3.5 transition-all`}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                      {post.authorName?.slice(0, 1) || "F"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{post.authorName}</span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold bg-slate-100 text-slate-700"
                        >
                          {post.authorRole}
                        </Badge>
                        {post.groupName && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium text-emerald-800 border-emerald-200 bg-emerald-50/60"
                          >
                            {post.groupName}
                          </Badge>
                        )}
                        {post.isPinned && (
                          <Badge
                            variant="amber"
                            className="text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1"
                          >
                            <Pin className="h-2.5 w-2.5" /> Pinned
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(post.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <VoiceReadoutButton
                      text={`${post.title ? post.title + ". " : ""}${post.content}`}
                      size="sm"
                    />
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        post.postType === "MARKET_PRICE"
                          ? "bg-amber-100 text-amber-900"
                          : post.postType === "FARMING_TIPS"
                          ? "bg-teal-100 text-teal-900"
                          : post.postType === "PROBLEM"
                          ? "bg-rose-100 text-rose-900"
                          : post.postType === "BULK_SELLING"
                          ? "bg-indigo-100 text-indigo-900"
                          : post.postType === "DEMAND"
                          ? "bg-purple-100 text-purple-900"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {post.postType.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>

                {/* Title & Content */}
                {post.title && (
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {post.title}
                  </h4>
                )}

                {/* Market Price Box (Part 5 Requirements) */}
                {post.marketPriceDetails && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                        <TrendingUp className="h-4 w-4 text-amber-700" />
                        <span>COMMUNITY REPORTED MANDI PRICE</span>
                        <span className="text-[10px] text-amber-600 font-normal">
                          (Non-government benchmark)
                        </span>
                      </div>
                      <div className="text-sm font-bold">
                        {post.marketPriceDetails.crop}:{" "}
                        <span className="text-xl font-extrabold text-amber-900">
                          ₹{post.marketPriceDetails.pricePerKg}/kg
                        </span>
                      </div>
                      <div className="text-xs text-amber-800/80 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {post.marketPriceDetails.marketName}, {post.marketPriceDetails.location}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="self-start sm:self-center border-amber-300 bg-white/70 text-amber-900 text-[10px] font-semibold"
                    >
                      {post.marketPriceDetails.reportedDate}
                    </Badge>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Post Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLikeToggle(post._id)}
                      className={`flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                        isLiked ? "text-rose-600 font-semibold" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                      <span>{post.likesCount} Likes</span>
                    </button>

                    <button
                      onClick={() => handleOpenComments(post._id)}
                      className="flex items-center gap-1.5 font-medium text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{post.commentCount} Comments</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenComments(post._id)}
                    className="text-emerald-700 font-semibold text-xs hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? "Hide Comments" : "Reply / View Thread"}</span>
                  </button>
                </div>

                {/* Expanded Thread Drawer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/70 -mx-5 -mb-5 p-5 rounded-b-2xl animate-in fade-in duration-150">
                    <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Discussion Replies ({comments.length})
                    </h5>

                    {loadingComments ? (
                      <div className="py-4 text-center text-xs text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-1 text-emerald-700" />
                        Loading replies...
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        No replies yet. Be the first to share your input!
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {comments.map((c) => (
                          <div
                            key={c._id}
                            className={`p-3 rounded-xl bg-white border border-slate-200/80 text-xs space-y-1 ${
                              c.parentCommentId ? "ml-6 border-l-4 border-l-emerald-600" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <strong className="text-slate-900">{c.authorName}</strong>
                                <span className="text-[10px] text-slate-500">({c.authorRole})</span>
                              </div>
                              <button
                                onClick={() => {
                                  setReplyingToCommentId(c._id);
                                  setNewCommentText(`@${c.authorName} `);
                                }}
                                className="text-emerald-700 hover:underline text-[10px] font-semibold cursor-pointer"
                              >
                                Reply
                              </button>
                            </div>
                            <p className="text-slate-700 leading-normal">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <div className="pt-2">
                      {replyingToCommentId && (
                        <div className="text-[11px] text-emerald-700 mb-1 flex items-center justify-between">
                          <span>Replying to comment...</span>
                          <button
                            onClick={() => setReplyingToCommentId(null)}
                            className="text-slate-500 hover:text-slate-700 text-[10px]"
                          >
                            Cancel reply
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder={t("fpoCommunity.commentPlaceholder", "Write a helpful reply or farm advice...")}
                            className="w-full rounded-xl border border-slate-300 bg-white pl-3 pr-10 py-2 text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                            disabled={submittingComment}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post._id);
                              }
                            }}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <VoiceInputButton
                              onTranscript={(txt) => setNewCommentText((prev) => prev ? `${prev} ${txt}` : txt)}
                              size="sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddComment(post._id)}
                          disabled={!newCommentText.trim() || submittingComment}
                          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {submittingComment ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                Share with Farmer Community
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Farmer Group
                  </label>
                  <select
                    value={postGroupId}
                    onChange={(e) => setPostGroupId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-600"
                    required
                  >
                    {groupsList.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.product})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discussion Category
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="GENERAL">General Discussion</option>
                    <option value="MARKET_PRICE">Market Price Report (Mandi Rate)</option>
                    <option value="FARMING_TIPS">Farming Tips &amp; Agronomy</option>
                    <option value="PROBLEM">Crop Problem / Pest Alert</option>
                    <option value="BULK_SELLING">Bulk Selling Announcement</option>
                    <option value="DEMAND">Produce Demand / Requirement</option>
                    <option value="ANNOUNCEMENT">FPO Announcement</option>
                  </select>
                </div>
              </div>

              {/* Conditional Market Price Fields */}
              {postType === "MARKET_PRICE" && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-amber-700" />
                    Live Mandi Price Report Details
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-medium text-amber-900">
                          {t("farmerForm.cropName", "Crop Name")}
                        </label>
                        <VoiceInputButton onTranscript={(txt) => setMarketCrop(txt)} size="sm" />
                      </div>
                      <input
                        type="text"
                        value={marketCrop}
                        onChange={(e) => setMarketCrop(e.target.value)}
                        placeholder="e.g. Tomato, Onion, Rice"
                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-amber-900 mb-0.5">
                        Observed Price (₹ / kg)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={marketPrice}
                        onChange={(e) => setMarketPrice(e.target.value)}
                        placeholder="e.g. 29.5"
                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900"
                        required
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="block text-[11px] font-medium text-amber-900">
                          Mandi / Market Name
                        </label>
                        <VoiceInputButton onTranscript={(txt) => setMarketName(txt)} size="sm" />
                      </div>
                      <input
                        type="text"
                        value={marketName}
                        onChange={(e) => setMarketName(e.target.value)}
                        placeholder="e.g. Hinjilicut RMC Yard"
                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-amber-900 mb-0.5">
                        District / State
                      </label>
                      <input
                        type="text"
                        value={marketLocation}
                        onChange={(e) => setMarketLocation(e.target.value)}
                        placeholder="e.g. Ganjam, Odisha"
                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t("fpoCommunity.postTitle", "Title (Optional)")}
                  </label>
                  <VoiceInputButton onTranscript={(txt) => setPostTitle(txt)} size="sm" />
                </div>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Summary of your update..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {t("fpoCommunity.postContent", "Message / Details")}
                  </label>
                  <VoiceInputButton
                    onTranscript={(txt) => setPostContent((prev) => prev ? `${prev} ${txt}` : txt)}
                    size="sm"
                  />
                </div>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  placeholder="Share details, pest observations, advice, or pool availability..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !postContent.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Publish to Community</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Discussion Summary Modal */}
      {showAiSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-purple-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-lg text-purple-200 border border-white/10">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Gemini AI Community Synthesis</h3>
                  <p className="text-xs text-purple-200">
                    Live discussion analysis for {aiSummaryResult?.groupName || "Community Groups"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiSummaryModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {loadingAiSummary ? (
                <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-700" />
                  <span>Analyzing community posts, mandi prices &amp; pooling updates...</span>
                </div>
              ) : aiSummaryResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5" /> Executive Summary
                    </span>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                      {aiSummaryResult.summary}
                    </p>
                  </div>

                  {aiSummaryResult.bullets && aiSummaryResult.bullets.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Key Community Takeaways
                      </span>
                      <ul className="space-y-2">
                        {aiSummaryResult.bullets.map((b, idx) => (
                          <li
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-600 border-t border-slate-100">
                    <span>Generated via Google Gemini 2.5</span>
                    <span className="text-emerald-700 font-semibold">✓ Grounded in MongoDB</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Failed to load AI summary.</p>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAiSummaryModal(false)}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
