import React, { useEffect, useState, useRef, useDeferredValue, startTransition } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  Order,
  OrderItem,
  MenuItem,
  Category,
  Promo,
  UserProfile,
  Reward,
} from "../types";
import { Icon } from "../components/Icons";
import {
  generateEditedImage,
  generatePromoStrategy,
  generatePromoImage,
} from "../utils/aiHelper";

// Fallback Logo
const DEFAULT_LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZDEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRjU5RTBCO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNEOTc3MDY7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgZmlsbD0iIzE3MTcxNyIvPgogIDxjaXJjbGUgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMjEwIiBzdHJva2U9InVybCgjZ3JhZDEpIiBzdHJva2Utd2lkdGg9IjE2IiBmaWxsPSJub25lIiAvPgogIDxjaXJjbGUgY3g9IjI1NiIgY3k9IjI1NiIgcj0iMTgwIiBzdHJva2U9IiMyNjI2MjYiIHN0cm9rZS13aWR0aD0iNCIgZmlsbD0ibm9uZSIgLz4KICA8dGV4dCB4PSIyNTYiIHk9IjI5MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0idXJsKCNncmFkMSkiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLCBzZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iMjQwIiBmb250LXN0eWxlPSJpdGFsaWMiPkRMPC90ZXh0PgogIDx0ZXh0IHg9IjI1NiIgeT0iNDIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUNBM0FGIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMCIgbGV0dGVyLXNwYWNpbmc9IjYiIGZvbnQtd2VpZ2h0PSJib2xkIj5FU1QuIDIwMjU8L3RleHQ+Cjwvc3ZnPg==`;

// Helper to convert base64 to blob safely
const base64ToBlob = (base64: string, mimeType: string = "image/png") => {
  const byteCharacters = atob(base64.split(",")[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

export const Admin: React.FC = () => {
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);

  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [typingText, setTypingText] = useState("");
  const [quote, setQuote] = useState("");

  // --- DASHBOARD STATE ---
  const [activeTab, setActiveTab] = useState<
    | "orders"
    | "menu"
    | "stats"
    | "promos"
    | "rewards"
    | "branding"
    | "users"
    | "reviews"
  >("orders");

  // Data State
  const [orders, setOrders] = useState<(Order & { items: OrderItem[] })[]>([]);
  const [orderSearch, setOrderSearch] = useState("");

  // Memoize derived order data to avoid expensive recalculation during tab switches
  const filteredOrders = React.useMemo(() => {
    if (!orderSearch.trim()) return orders;
    const q = orderSearch.toLowerCase();
    return orders.filter(
      (o) =>
        (o.customer_name?.toLowerCase() || "").includes(q) ||
        (o.profile_phone || "").includes(q) ||
        o.id.toLowerCase().includes(q),
    );
  }, [orders, orderSearch]);

  const ordersByStatus = React.useMemo(() => {
    const statuses = [
      "new",
      "preparing",
      "ready",
      "out_for_delivery",
      "completed",
      "cancelled",
    ];
    const map: Record<string, (Order & { items: OrderItem[] })[]> = {};
    statuses.forEach((s) => (map[s] = []));
    orders.forEach((o) => {
      (map[o.status] ||= []).push(o);
    });
    const counts: Record<string, number> = {};
    statuses.forEach((s) => (counts[s] = map[s]?.length || 0));
    return { map, counts };
  }, [orders]);

  const ratedOrders = React.useMemo(
    () => orders.filter((o) => o.rating && o.rating > 0),
    [orders],
  );

  const ratingCounts = React.useMemo(() => {
    const rc: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratedOrders.forEach((o) => {
      rc[o.rating as number] = (rc[o.rating as number] || 0) + 1;
    });
    return rc;
  }, [ratedOrders]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Optimize menu items lookup per category
  const menuItemsByCategory = React.useMemo(() => {
    const map: Record<string, MenuItem[]> = {};
    menuItems.forEach((m) => { (map[m.category_id] ||= []).push(m); });
    return map;
  }, [menuItems]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  // Edit State
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(
    null,
  );
  const [editingPromo, setEditingPromo] = useState<Partial<Promo> | null>(null);
  const [editingReward, setEditingReward] = useState<Partial<Reward> | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // User Management State
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [newPinCode, setNewPinCode] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // AI State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResultImage, setAiResultImage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTarget, setAiTarget] = useState<"menuItem" | "logo" | "authLogo">(
    "menuItem",
  );

  // AI Promo State
  const [generatingPromo, setGeneratingPromo] = useState(false);
  const [aiPromoSuggestion, setAiPromoSuggestion] = useState<{
    title: string;
    description: string;
    imagePrompt: string;
  } | null>(null);
  const [generatedBanner, setGeneratedBanner] = useState<string | null>(null);

  // Branding State
  const [appLogo, setAppLogo] = useState<string>(DEFAULT_LOGO_BASE64);
  const [authLogo, setAuthLogo] = useState<string>(DEFAULT_LOGO_BASE64);
  const [unsavedBranding, setUnsavedBranding] = useState(false);

  // Stats State
  const [stats, setStats] = useState({
    daily: 0,
    dailyCount: 0,
    total: 0,
    totalCount: 0,
    avgRating: 0,
    reviewCount: 0,
  });
  const [topItems, setTopItems] = useState<{ name: string; count: number }[]>(
    [],
  );

  // Defer heavy tab rendering to keep clicks responsive
  const deferredActiveTab = useDeferredValue(activeTab);

  // --- INITIALIZATION ---
  useEffect(() => {
    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning, Architect.");
    else if (hour < 18) setGreeting("Good Afternoon, Visionary.");
    else setGreeting("Good Evening, Leader.");

    // Set motivational quote
    const quotes = [
      "Quality is not an act, it is a habit.",
      "Simplicity is the ultimate sophistication.",
      "The details are not the details. They make the design.",
      "Innovation distinguishes between a leader and a follower.",
      "Food is our art, service is our signature.",
    ];
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);

    if (isAuthenticated) {
      fetchOrders();
      fetchMenu();
      fetchPromos();
      fetchRewards();
      fetchProfiles();

      // Subscribe to Realtime Orders
      const channel = supabase
        .channel("admin-orders")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            fetchOrders();
            playNotificationSound();
          },
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated]);

  // Typing Effect
  useEffect(() => {
    if (!isAuthenticated && greeting) {
      setTypingText("");
      let index = 0;
      const timer = setInterval(() => {
        setTypingText((prev) => greeting.slice(0, index + 1));
        index++;
        if (index > greeting.length) clearInterval(timer);
      }, 80);
      return () => clearInterval(timer);
    }
  }, [greeting, isAuthenticated]);

  const playNotificationSound = () => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  // --- FETCHERS & ACTIONS ---
  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .order("created_at", { ascending: false });
    if (data) {
      setOrders(data as any);

      const now = new Date();
      const dailyOrders = data.filter((o) => {
        const d = new Date(o.created_at);
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          o.status !== "cancelled"
        );
      });
      const allOrders = data.filter((o) => o.status === "completed");

      // Review Stats
      const ratedOrders = data.filter((o) => o.rating && o.rating > 0);
      const avgRating =
        ratedOrders.length > 0
          ? ratedOrders.reduce((sum, o) => sum + (o.rating || 0), 0) /
            ratedOrders.length
          : 0;

      setStats({
        daily: dailyOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
        dailyCount: dailyOrders.length,
        total: allOrders.reduce((sum, o) => sum + Number(o.total_amount), 0),
        totalCount: allOrders.length,
        avgRating,
        reviewCount: ratedOrders.length,
      });

      const itemCounts: Record<string, number> = {};
      data.forEach((o) => {
        if (o.status !== "cancelled" && o.items) {
          o.items.forEach((i: any) => {
            itemCounts[i.menu_item_name] =
              (itemCounts[i.menu_item_name] || 0) + i.quantity;
          });
        }
      });
      const ranked = Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopItems(ranked);
    }
  };

  // ... (Other Fetchers same as before)
  const fetchMenu = async () => {
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    const { data: items } = await supabase
      .from("menu_items")
      .select("*")
      .order("name");
    if (cats) setCategories(cats);
    if (items) setMenuItems(items);
  };

  const fetchPromos = async () => {
    const { data } = await supabase
      .from("promos")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPromos(data);
  };

  const fetchRewards = async () => {
    const { data } = await supabase
      .from("rewards")
      .select("*")
      .order("points_cost", { ascending: true });
    if (data) setRewards(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProfiles(data as UserProfile[]);
  };

  const fetchBranding = async () => {
    const { data: logoData } = await supabase
      .from("app_settings")
      .select("*")
      .eq("key", "logo_url")
      .single();
    if (logoData) setAppLogo(logoData.value);

    const { data: authData } = await supabase
      .from("app_settings")
      .select("*")
      .eq("key", "auth_logo_url")
      .single();
    if (authData) setAuthLogo(authData.value);
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === "branding") {
      // Delay fetch slightly to ensure the UI paints the new tab first
      requestAnimationFrame(() => {
        fetchBranding();
      });
    }
  }, [activeTab, isAuthenticated]);

  const updateStatus = async (id: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", id);
    fetchOrders();
  };

  const printOrderTicket = (order: Order & { items: OrderItem[] }) => {
    // ... (Same print function)
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = `
      <html>
        <head><title>Order #${order.id.slice(0, 6)}</title></head>
        <body style="font-family: monospace; padding: 20px; width: 300px;">
          <h2 style="text-align:center;">DON LOUIS</h2>
          <div style="text-align:center; margin-bottom: 10px;">Order #${order.id.slice(0, 6)}</div>
          <div style="border-bottom: 1px dashed black;"></div>
          <p><strong>Customer:</strong> ${order.customer_name}<br/>${order.profile_phone}</p>
          <p><strong>Type:</strong> ${order.order_type.toUpperCase()}</p>
          ${order.customer_address ? `<p><strong>Address:</strong> ${order.customer_address}</p>` : ""}
          <div style="border-bottom: 1px dashed black; margin: 10px 0;"></div>
          ${order.items
            ?.map(
              (i) => `
            <div style="display:flex; justify-content:space-between;"><span>${i.quantity}x ${i.menu_item_name}</span><span>$${(i.price_at_time * i.quantity).toFixed(2)}</span></div>
            ${i.notes ? `<div style="font-size:0.8em; font-style:italic; padding-left:10px;">Note: ${i.notes}</div>` : ""}
          `,
            )
            .join("")}
          <div style="border-bottom: 1px dashed black; margin: 10px 0;"></div>
          <div style="display:flex; justify-content:space-between; font-weight:bold;"><span>Total</span><span>$${order.total_amount.toFixed(2)}</span></div>
          <br/><br/>
          <div style="text-align:center;">Thank you!</div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // ... (Other Handlers: handleSaveItem, handleDeleteItem, etc.)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const payload = { ...editingItem };
    if (!payload.category_id && categories.length > 0)
      payload.category_id = categories[0].id;

    try {
      if (payload.id)
        await supabase.from("menu_items").update(payload).eq("id", payload.id);
      else await supabase.from("menu_items").insert([payload]);
      setEditingItem(null);
      fetchMenu();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm("Delete item?")) {
      await supabase.from("menu_items").delete().eq("id", id);
      fetchMenu();
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "menuItem" | "logo" | "authLogo" = "menuItem",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileName = `${target}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
    try {
      const { error } = await supabase.storage
        .from("menu-items")
        .upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage
        .from("menu-items")
        .getPublicUrl(fileName);

      if (target === "menuItem")
        setEditingItem((prev) => ({ ...prev, image_url: data.publicUrl }));
      else if (target === "logo") {
        setAppLogo(data.publicUrl);
        setUnsavedBranding(true);
      } else if (target === "authLogo") {
        setAuthLogo(data.publicUrl);
        setUnsavedBranding(true);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: "logo_url", value: appLogo },
        { key: "auth_logo_url", value: authLogo },
      ];
      const { error } = await supabase.from("app_settings").upsert(updates);
      if (error) throw error;
      setUnsavedBranding(false);
      alert("Branding updated successfully!");
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSmartPromo = async () => {
    setGeneratingPromo(true);
    setAiPromoSuggestion(null);
    setGeneratedBanner(null);

    // Yield to the browser so the "Analyzing..." UI can paint and avoid long INP
    await new Promise((resolve) => requestAnimationFrame(resolve));

    try {
      const strategy = await generatePromoStrategy(stats);
      setAiPromoSuggestion(strategy);
      setEditingPromo((prev) => ({
        ...prev,
        title: strategy.title,
        description: strategy.description,
        is_active: true,
      }));

      // Generate image (may take time) — user already sees loading state
      const image = await generatePromoImage(strategy.imagePrompt);
      setGeneratedBanner(image);
    } catch (e: any) {
      alert("AI Error: " + e.message);
    } finally {
      setGeneratingPromo(false);
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo) return;
    if (uploading) {
      alert("Please wait for the image to finish uploading.");
      return;
    }
    setSaving(true);
    try {
      let finalUrl = editingPromo.image_url;
      if (generatedBanner && generatedBanner.startsWith("data:")) {
        const blob = base64ToBlob(generatedBanner, "image/png");
        const fileName = `promo-ai-${Date.now()}.png`;
        const { error } = await supabase.storage
          .from("menu-items")
          .upload(fileName, blob, { contentType: "image/png", upsert: true });
        if (error) throw error;
        const { data } = supabase.storage
          .from("menu-items")
          .getPublicUrl(fileName);
        finalUrl = data.publicUrl;
      }
      const payload = {
        title: editingPromo.title,
        description: editingPromo.description,
        is_active: editingPromo.is_active ?? true,
        image_url: finalUrl,
      };
      if (editingPromo.id)
        await supabase.from("promos").update(payload).eq("id", editingPromo.id);
      else await supabase.from("promos").insert([payload]);
      setEditingPromo(null);
      setGeneratedBanner(null);
      setAiPromoSuggestion(null);
      await fetchPromos();
    } catch (err: any) {
      alert("Failed to save promo: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePromoFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    const fileName = `promo-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
    try {
      const { error } = await supabase.storage
        .from("menu-items")
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage
        .from("menu-items")
        .getPublicUrl(fileName);
      setEditingPromo((prev) => {
        if (!prev) return { image_url: data.publicUrl };
        return { ...prev, image_url: data.publicUrl };
      });
      setGeneratedBanner(null);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const deletePromo = async (id: string, imageUrl?: string | null) => {
    if (!window.confirm("Are you sure you want to delete this promo?")) return;

    try {
      const { error } = await supabase.from("promos").delete().eq("id", id);
      if (error) throw error;

      if (imageUrl) {
        try {
          const urlParts = imageUrl.split("/");
          const fileName = urlParts[urlParts.length - 1];
          if (fileName) {
            await supabase.storage.from("menu-items").remove([fileName]);
          }
        } catch (e) {
          console.warn("Could not delete associated image", e);
        }
      }
      setPromos((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("Failed to delete promo: " + err.message);
      fetchPromos();
    }
  };

  const startEditPromo = (promo: Promo) => {
    setEditingPromo(promo);
    setGeneratedBanner(null);
    setAiPromoSuggestion(null);
    if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;
    if (editingReward.id)
      await supabase
        .from("rewards")
        .update(editingReward)
        .eq("id", editingReward.id);
    else await supabase.from("rewards").insert([editingReward]);
    setEditingReward(null);
    fetchRewards();
  };

  const handleDeleteReward = async (id: string) => {
    if (confirm("Delete rule?")) {
      await supabase.from("rewards").delete().eq("id", id);
      fetchRewards();
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    if (!newPinCode || newPinCode.length !== 4) {
      alert("PIN must be 4 digits");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ pin_code: newPinCode })
        .eq("id", resettingUser.id);

      if (error) throw error;

      alert(`PIN updated for ${resettingUser.full_name}`);
      setResettingUser(null);
      setNewPinCode("");
      fetchProfiles(); // Refresh list
    } catch (err: any) {
      alert("Failed to update PIN: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAIModal = (target: "menuItem" | "logo" | "authLogo") => {
    setAiTarget(target);
    setAiResultImage(null);
    setAiPrompt("");
    setAiError(null);
    setIsAIModalOpen(true);
  };

  const handleAIGenerate = async () => {
    let sourceImage =
      aiTarget === "menuItem" ? editingItem?.image_url : appLogo;
    if (aiTarget === "authLogo") sourceImage = authLogo;

    if (!sourceImage) {
      setAiError("No source image found.");
      return;
    }
    if (!aiPrompt) {
      setAiError("Please describe the edits.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      let base64Image = sourceImage;
      if (sourceImage.startsWith("http")) {
        const response = await fetch(sourceImage);
        const blob = await response.blob();
        base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
      const result = await generateEditedImage(base64Image, aiPrompt);
      setAiResultImage(result);
    } catch (err: any) {
      setAiError(err.message || "Failed to generate.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIAccept = async () => {
    if (!aiResultImage) return;
    try {
      setAiLoading(true);
      const blob = base64ToBlob(aiResultImage, "image/png");
      const fileName = `ai-edited-${Date.now()}.png`;
      const { error } = await supabase.storage
        .from("menu-items")
        .upload(fileName, blob, { contentType: "image/png" });
      if (error) throw error;
      const { data } = supabase.storage
        .from("menu-items")
        .getPublicUrl(fileName);

      if (aiTarget === "menuItem") {
        setEditingItem((prev) =>
          prev ? { ...prev, image_url: data.publicUrl } : null,
        );
      } else if (aiTarget === "logo") {
        setAppLogo(data.publicUrl);
        setUnsavedBranding(true);
      } else if (aiTarget === "authLogo") {
        setAuthLogo(data.publicUrl);
        setUnsavedBranding(true);
      }

      setIsAIModalOpen(false);
    } catch (err: any) {
      setAiError("Failed to save: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // --- LOGIN SCREEN ---
  const handleLogin = (val: string) => {
    // ... (Same login logic)
    if (isVerifying) return;
    if (val === "clear") {
      setPin("");
      setLoginError(false);
      return;
    }

    const newPin = pin + val;
    if (newPin.length <= 4) {
      setPin(newPin);
      if (newPin.length === 4) {
        setIsVerifying(true);
        setTimeout(() => {
          if (newPin === "9696") {
            setIsAuthenticated(true);
            setIsVerifying(false);
          } else {
            setLoginError(true);
            setPin("");
            setTimeout(() => setLoginError(false), 500);
            setIsVerifying(false);
          }
        }, 300);
      }
    }
  };

  if (!isAuthenticated) {
    // ... (Same Login UI Code)
    return (
      <div className="fixed inset-0 w-full h-[100dvh] bg-neutral-950 flex flex-col font-sans overflow-hidden">
        {/* ATMOSPHERE / AI BACKGROUND */}
        <div className="absolute inset-0 z-0">
          {/* Deep Dark Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
          {/* Moving Orbs */}
          <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-brand-gold/5 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-indigo-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
          {/* Scanning Line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent animate-scan shadow-[0_0_20px_#F59E0B]"></div>
        </div>

        <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 safe-pb">
          {/* HEADER */}
          <div className="text-center pt-8 animate-fade-in-down flex-shrink-0">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-brand-gold/20 shadow-[0_0_30px_rgba(245,158,11,0.1)] mb-4 relative group">
              <div className="absolute inset-0 rounded-2xl border border-brand-gold/20 animate-ping opacity-10"></div>
              <Icon
                name="user"
                className="w-6 h-6 text-brand-gold group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <h2 className="text-[10px] font-bold text-brand-gold tracking-[0.3em] uppercase mb-1 font-mono min-h-[1.5em]">
              {typingText}
              <span className="animate-pulse">_</span>
            </h2>
            <h1 className="text-2xl font-serif text-white tracking-wide">
              Command Center
            </h1>
          </div>

          {/* CENTER: PIN VISUALIZATION & MESSAGE */}
          <div className="flex-grow flex flex-col justify-center items-center gap-6 animate-fade-in min-h-[100px]">
            <div className="flex gap-4 relative">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="relative">
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 border 
                                    ${
                                      pin.length > i
                                        ? loginError
                                          ? "bg-red-500 border-red-500 shadow-[0_0_15px_#EF4444]"
                                          : "bg-brand-gold border-brand-gold shadow-[0_0_15px_#F59E0B] scale-125"
                                        : "bg-neutral-800 border-neutral-700"
                                    }`}
                  ></div>
                </div>
              ))}
            </div>

            <div className="h-4 flex items-center justify-center">
              {isVerifying ? (
                <span className="text-xs font-mono text-brand-gold animate-pulse">
                  VERIFYING...
                </span>
              ) : loginError ? (
                <span className="text-xs font-mono text-red-500 tracking-widest">
                  ACCESS DENIED
                </span>
              ) : (
                <span className="text-[10px] font-mono text-gray-600 tracking-widest">
                  ENTER SECURITY PIN
                </span>
              )}
            </div>
          </div>

          {/* KEYPAD - Responsive Flex with optimized buttons */}
          <div className="w-full max-w-sm mx-auto grid grid-cols-3 gap-3 mb-6 flex-shrink-0 flex-grow-0">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={(e) => {
                  e.preventDefault();
                  handleLogin(num.toString());
                }}
                style={{ touchAction: "manipulation" }}
                className="group relative h-14 md:h-16 rounded-xl bg-neutral-800/50 active:bg-neutral-800 border border-white/5 hover:border-brand-gold/30 flex items-center justify-center transition-transform duration-75 active:scale-95 shadow-lg touch-manipulation select-none"
              >
                <span className="text-xl text-white font-mono group-hover:text-brand-gold transition-colors">
                  {num}
                </span>
              </button>
            ))}
            <div className="flex items-center justify-center pointer-events-none opacity-20">
              <Icon name="user" className="w-4 h-4 text-gray-600" />
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleLogin("0");
              }}
              style={{ touchAction: "manipulation" }}
              className="group relative h-14 md:h-16 rounded-xl bg-neutral-800/50 active:bg-neutral-800 border border-white/5 hover:border-brand-gold/30 flex items-center justify-center transition-transform duration-75 active:scale-95 shadow-lg touch-manipulation select-none"
            >
              <span className="text-xl text-white font-mono group-hover:text-brand-gold transition-colors">
                0
              </span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleLogin("clear");
              }}
              style={{ touchAction: "manipulation" }}
              className="h-14 md:h-16 rounded-xl flex items-center justify-center text-gray-500 hover:text-white hover:bg-neutral-800/50 active:scale-95 transition-transform duration-75 touch-manipulation select-none"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Clear
              </span>
            </button>
          </div>

          {/* FOOTER: DAILY WISDOM */}
          <div className="text-center pt-2 border-t border-white/5 flex-shrink-0 pb-1">
            <p className="text-[8px] text-gray-500 italic font-serif leading-relaxed truncate px-4">
              "{quote}"
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN ADMIN UI ---
  return (
    <div
      className="p-4 md:p-8 bg-neutral-900 min-h-screen text-gray-100"
      ref={topRef}
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
        <div className="flex items-center gap-4 self-start md:self-center">
          <button
            onClick={() => navigate("/")}
            className="bg-neutral-800 p-2 rounded-xl hover:bg-neutral-700 border border-neutral-700 text-gray-400 hover:text-white transition-colors"
            title="Exit Admin"
          >
            <Icon name="chevronRight" className="w-6 h-6 rotate-180" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-gold tracking-tight">
              Admin Console
            </h1>
            <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">
              Welcome back, Manager
            </p>
          </div>
        </div>
        <div className="flex bg-neutral-800 rounded-xl p-1 overflow-x-auto max-w-full shadow-lg border border-neutral-700 w-full md:w-auto">
          {[
            "orders",
            "menu",
            "stats",
            "reviews",
            "promos",
            "rewards",
            "users",
            "branding",
          ].map((t) => (
            <button
              key={t}
              onClick={() => startTransition(() => setActiveTab(t as any))}
              className={`px-5 py-2.5 rounded-lg capitalize text-sm font-bold transition-all whitespace-nowrap ${activeTab === t ? "bg-brand-gold text-neutral-900 shadow-md" : "text-gray-400 hover:text-white"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-fade-in">
        {deferredActiveTab === "orders" && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-4 top-3.5 w-5 h-5 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search orders by Name, Phone, or ID..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full bg-neutral-800 text-white pl-12 pr-4 py-3 rounded-xl border border-neutral-700 outline-none focus:border-brand-gold transition-colors shadow-lg"
              />
            </div>

            {/* Status Counts (Horizontal Scroll) */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {[
                "new",
                "preparing",
                "ready",
                "out_for_delivery",
                "completed",
              ].map((status) => (
                <div
                  key={status}
                  className="bg-neutral-800 px-4 py-2 rounded-lg border border-neutral-700 whitespace-nowrap min-w-[140px] shadow-md"
                >
                  <span className="text-xs text-gray-500 uppercase block font-bold tracking-wider mb-1">
                    {status.replace(/_/g, " ")}
                  </span>
                  <span className="text-2xl font-bold text-white">
                    {ordersByStatus.counts[status] || 0}
                  </span>
                </div>
              ))}
            </div>

            {/* Order List */}
            <div className="grid gap-4">
              {filteredOrders.map((o) => (
                <div
                  key={o.id}
                  className={`bg-neutral-800 p-5 rounded-xl border-l-4 shadow-lg ${o.status === "new" ? "border-brand-gold animate-pulse-slow" : "border-neutral-600"}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg text-white">
                        Order #{o.id.slice(0, 6)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {o.customer_name} • {o.profile_phone}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xl font-bold text-brand-gold">
                        ${o.total_amount.toFixed(2)}
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-neutral-700 uppercase font-bold">
                        {o.order_type}
                      </span>
                    </div>
                  </div>
                  <div className="bg-neutral-900/50 p-3 rounded-lg mb-4 text-sm space-y-2">
                    {o.items?.map((i) => (
                      <div
                        key={i.id}
                        className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between">
                          <span className="text-gray-300 font-medium">
                            {i.quantity}x {i.menu_item_name}
                          </span>
                          <span className="text-gray-500">
                            ${(i.price_at_time * i.quantity).toFixed(2)}
                          </span>
                        </div>
                        {i.notes && (
                          <div className="text-xs text-brand-gold bg-brand-gold/10 p-1.5 rounded-md italic border border-brand-gold/20 flex items-start gap-1">
                            <Icon
                              name="menu"
                              className="w-3 h-3 mt-0.5 flex-shrink-0"
                            />
                            <span>{i.notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {o.customer_address && (
                    <div className="mb-4 text-sm text-gray-400 flex items-start gap-2">
                      <Icon name="home" className="w-4 h-4 mt-0.5" />
                      {o.customer_address}
                    </div>
                  )}
                  {o.tip_amount && o.tip_amount > 0 && (
                    <div className="mb-4 text-sm text-green-400 font-bold flex items-center gap-2">
                      <Icon name="star" className="w-4 h-4" />
                      Tip Included: ${o.tip_amount.toFixed(2)}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => printOrderTicket(o)}
                      className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm font-bold"
                    >
                      Print
                    </button>
                    {o.status === "new" && (
                      <button
                        onClick={() => updateStatus(o.id, "preparing")}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold shadow-lg shadow-blue-900/20"
                      >
                        Accept
                      </button>
                    )}
                    {o.status === "preparing" && (
                      <button
                        onClick={() => updateStatus(o.id, "ready")}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold"
                      >
                        Ready
                      </button>
                    )}
                    {o.status === "ready" && (
                      <button
                        onClick={() =>
                          updateStatus(
                            o.id,
                            o.order_type === "delivery"
                              ? "out_for_delivery"
                              : "completed",
                          )
                        }
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold"
                      >
                        {o.order_type === "delivery"
                          ? "Send Driver"
                          : "Complete"}
                      </button>
                    )}
                    {o.status === "out_for_delivery" && (
                      <button
                        onClick={() => updateStatus(o.id, "completed")}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold"
                      >
                        Delivered
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(o.id, "cancelled")}
                      className="px-3 py-2 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded text-sm font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
              {orders.filter(
                (o) =>
                  (o.customer_name?.toLowerCase() || "").includes(
                    orderSearch.toLowerCase(),
                  ) ||
                  (o.profile_phone || "").includes(orderSearch) ||
                  o.id.toLowerCase().includes(orderSearch.toLowerCase()),
              ).length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  No matching orders found
                </div>
              )}
            </div>
          </div>
        )}

        {/* ... [Rest of Admin tabs - MENU] ... */}
        {deferredActiveTab === "menu" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() =>
                  setEditingItem({
                    name: "",
                    price: 0,
                    is_available: true,
                    category_id: categories[0]?.id,
                  })
                }
                className="bg-brand-gold text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-yellow-400"
              >
                <Icon name="plus" className="w-5 h-5" /> Add Item
              </button>
            </div>
            {categories.map((cat) => {
              const itemsForCat = (menuItemsByCategory[cat.id] || []);
              return (
              <div
                key={cat.id}
                className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700"
              >
                <h2 className="text-xl font-bold text-white mb-4 border-b border-neutral-700 pb-2">
                  {cat.name}
                </h2>
                <div className="grid gap-3">
                  {itemsForCat.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-neutral-900/50 p-3 rounded-xl border border-neutral-800 hover:border-neutral-600 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                className="w-full h-full object-cover"
                                loading="lazy" decoding="async"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-700">
                                <Icon name="menu" className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white">
                              {item.name}
                            </div>
                            <div className="text-sm text-brand-gold font-mono">
                              ${item.price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600"
                          >
                            <Icon name="menu" className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-2 bg-red-900/20 text-red-500 rounded-lg hover:bg-red-900/40"
                          >
                            <Icon name="trash" className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            {/* EDIT MENU ITEM MODAL */}
            {editingItem && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-neutral-900 border border-brand-gold w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">
                    {editingItem.id ? "Edit Item" : "New Item"}
                  </h3>
                  <form onSubmit={handleSaveItem} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        placeholder="Name"
                        className="bg-neutral-800 p-3 rounded-lg text-white outline-none focus:ring-1 focus:ring-brand-gold"
                        value={editingItem.name || ""}
                        onChange={(e) =>
                          setEditingItem((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        className="bg-neutral-800 p-3 rounded-lg text-white outline-none focus:ring-1 focus:ring-brand-gold"
                        value={editingItem.price || ""}
                        onChange={(e) =>
                          setEditingItem((prev) => ({
                            ...prev,
                            price: parseFloat(e.target.value),
                          }))
                        }
                      />
                    </div>
                    <select
                      className="w-full bg-neutral-800 p-3 rounded-lg text-white outline-none"
                      value={editingItem.category_id || ""}
                      onChange={(e) =>
                        setEditingItem((prev) => ({
                          ...prev,
                          category_id: e.target.value,
                        }))
                      }
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Description"
                      className="w-full bg-neutral-800 p-3 rounded-lg text-white outline-none h-20"
                      value={editingItem.description || ""}
                      onChange={(e) =>
                        setEditingItem((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />

                    <div className="flex items-center gap-4 border border-dashed border-neutral-700 p-4 rounded-lg">
                      {editingItem.image_url ? (
                        <img
                          src={editingItem.image_url}
                          className="w-16 h-16 rounded object-cover"
                          loading="lazy" decoding="async"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-800 rounded flex items-center justify-center text-xs text-gray-500">
                          No Img
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          onChange={(e) => handleImageUpload(e)}
                          className="text-xs text-gray-400 file:bg-neutral-700 file:text-white file:border-0 file:py-1 file:px-3 file:rounded-full file:mr-2"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => openAIModal("menuItem")}
                        className="text-indigo-400 text-xs font-bold hover:text-indigo-300"
                      >
                        ✨ AI Edit
                      </button>
                    </div>

                    <div className="flex justify-between items-center bg-neutral-800 p-3 rounded-lg">
                      <span className="text-gray-400">Available</span>
                      <input
                        type="checkbox"
                        checked={editingItem.is_available ?? true}
                        onChange={(e) =>
                          setEditingItem((prev) => ({
                            ...prev,
                            is_available: e.target.checked,
                          }))
                        }
                        className="w-5 h-5 accent-brand-gold"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="flex-1 py-3 bg-neutral-800 text-gray-400 rounded-xl font-bold hover:bg-neutral-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-brand-gold text-black rounded-xl font-bold hover:bg-yellow-400"
                      >
                        Save Item
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- REVIEWS TAB --- */}
        {deferredActiveTab === "reviews" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-neutral-800 rounded-2xl p-8 border border-neutral-700 text-center flex flex-col justify-center items-center">
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Overall Satisfaction
                </h2>
                <div className="text-5xl font-bold text-white mb-2">
                  {stats.avgRating.toFixed(1)}
                  <span className="text-xl text-gray-500">/5.0</span>
                </div>
                <div className="flex gap-1 text-brand-gold mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Icon
                      key={s}
                      name="star"
                      className={`w-6 h-6 ${s <= Math.round(stats.avgRating) ? "fill-current" : "opacity-30"}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  Based on {stats.reviewCount} customer reviews
                </p>
              </div>

              <div className="bg-neutral-800 rounded-2xl p-8 border border-neutral-700 flex flex-col justify-center">
                <h3 className="font-bold text-white mb-4">Rating Breakdown</h3>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingCounts[star] || 0;
                    const percent =
                      stats.reviewCount > 0
                        ? (count / stats.reviewCount) * 100
                        : 0;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <div className="w-8 text-sm font-bold text-gray-400 flex items-center gap-1">
                          {star} <Icon name="star" className="w-3 h-3" />
                        </div>
                        <div className="flex-1 h-2 bg-neutral-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-gold"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <div className="w-8 text-sm text-gray-500 text-right">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-4">
                Recent Feedback
              </h3>
              <div className="space-y-4">
                {orders.filter((o) => o.rating && o.rating > 0).length === 0 ? (
                  <div className="text-center py-20 text-gray-500 bg-neutral-800 rounded-2xl">
                    No reviews yet.
                  </div>
                ) : (
                  orders
                    .filter((o) => o.rating && o.rating > 0)
                    .map((o) => (
                      <div
                        key={o.id}
                        className={`bg-neutral-800 p-6 rounded-2xl border ${o.rating! <= 2 ? "border-red-900/50" : o.rating === 5 ? "border-brand-gold/30" : "border-neutral-700"}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex text-brand-gold">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Icon
                                  key={s}
                                  name="star"
                                  className={`w-4 h-4 ${s <= o.rating! ? "fill-current" : "opacity-20"}`}
                                />
                              ))}
                            </div>
                            <span className="font-bold text-white">
                              {o.rating}.0
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(o.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {o.feedback ? (
                          <p className="text-gray-300 italic mb-4">
                            "{o.feedback}"
                          </p>
                        ) : (
                          <p className="text-gray-600 text-sm italic mb-4">
                            No written feedback provided.
                          </p>
                        )}
                        <div className="flex items-center justify-between border-t border-neutral-700 pt-3 text-xs">
                          <span className="text-gray-500">
                            Order #{o.id.slice(0, 6)} • {o.customer_name}
                          </span>
                          <span className="font-mono text-brand-gold">
                            ${o.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ... [Rest of Admin tabs - PROMOS, REWARDS, USERS, STATS, BRANDING] ... */}
        {deferredActiveTab === "promos" && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  ✨ AI Marketing Suite
                </h2>
                <p className="text-indigo-200 mt-2 text-sm max-w-md">
                  Analyze sales data to generate high-converting offers and
                  stunning banners automatically.
                </p>
              </div>
              <button
                onClick={handleGenerateSmartPromo}
                disabled={generatingPromo}
                className="relative z-10 bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
              >
                {generatingPromo ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Icon name="star" className="w-5 h-5 text-yellow-500" />
                )}
                {generatingPromo ? "Analyzing..." : "Auto-Generate Promo"}
              </button>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full"></div>
            </div>

            {/* Promo Editor */}
            <div className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700">
              <h3 className="font-bold text-white mb-4">
                {editingPromo?.id ? "Edit Promo" : "Create New Promo"}
              </h3>
              <form
                onSubmit={handleSavePromo}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <div className="space-y-4">
                  <input
                    className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg text-white"
                    placeholder="Promo Title"
                    value={editingPromo?.title || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingPromo((prev) =>
                        prev
                          ? { ...prev, title: val }
                          : ({ title: val } as any),
                      );
                    }}
                  />
                  <textarea
                    className="w-full bg-neutral-900 border border-neutral-700 p-3 rounded-lg text-white h-24"
                    placeholder="Description"
                    value={editingPromo?.description || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingPromo((prev) =>
                        prev
                          ? { ...prev, description: val }
                          : ({ description: val } as any),
                      );
                    }}
                  />

                  <div className="flex items-center gap-3 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                    <span className="text-gray-400 text-sm font-bold">
                      Status:
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingPromo((prev) =>
                          prev
                            ? { ...prev, is_active: !prev.is_active }
                            : ({ is_active: true } as any),
                        )
                      }
                      className={`px-3 py-1 rounded text-xs font-bold ${editingPromo?.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                    >
                      {editingPromo?.is_active ? "Active" : "Hidden"}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-neutral-900 border border-neutral-700 rounded-lg h-40 flex items-center justify-center overflow-hidden relative group">
                    {generatedBanner || editingPromo?.image_url ? (
                      <img
                        src={generatedBanner || editingPromo?.image_url || ""}
                        className="w-full h-full object-cover"
                        loading="lazy" decoding="async"
                      />
                    ) : (
                      <div className="text-gray-600 flex flex-col items-center">
                        <Icon name="search" className="w-8 h-8 mb-2" />
                        <span>No Banner</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                      <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors shadow-lg">
                        <span className="flex items-center gap-2">
                          <Icon name="plus" className="w-4 h-4" /> Upload Custom
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handlePromoFileUpload}
                          accept="image/*"
                        />
                      </label>
                    </div>
                  </div>
                  {uploading && (
                    <div className="text-xs text-brand-gold animate-pulse text-center">
                      Uploading image...
                    </div>
                  )}
                  {aiPromoSuggestion && (
                    <div className="text-[10px] text-indigo-300 bg-indigo-900/30 p-2 rounded border border-indigo-500/20">
                      Strategy: {aiPromoSuggestion.imagePrompt}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPromo(null);
                        setGeneratedBanner(null);
                      }}
                      className="flex-1 py-2 bg-neutral-700 rounded-lg text-gray-300 font-bold"
                    >
                      {editingPromo?.id ? "Cancel Edit" : "Clear"}
                    </button>
                    <button
                      type="submit"
                      disabled={saving || uploading}
                      className="flex-1 py-2 bg-brand-gold text-black rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving && (
                        <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                      )}
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Promo List */}
            <div className="grid gap-4 md:grid-cols-2">
              {promos.map((p) => (
                <div
                  key={p.id}
                  className="relative group bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700"
                >
                  <div className="h-48 w-full bg-neutral-900 relative">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        className="w-full h-full object-cover"
                        alt={p.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700">
                        <Icon name="search" className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4 w-full">
                      <h4 className="font-bold text-white text-lg shadow-black drop-shadow-md">
                        {p.title}
                      </h4>
                      <p className="text-sm text-gray-300 line-clamp-1 opacity-80">
                        {p.description}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center bg-neutral-800">
                    <span
                      className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${p.is_active ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"}`}
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditPromo(p)}
                        className="text-xs font-bold text-gray-400 hover:text-white px-2 py-1 bg-neutral-700 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePromo(p.id, p.image_url)}
                        className="text-xs font-bold text-red-500 px-2 py-1 bg-neutral-700 rounded hover:bg-red-900/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {deferredActiveTab === "rewards" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Loyalty Rewards</h2>
              <button
                onClick={() =>
                  setEditingReward({ title: "", points_cost: 100 })
                }
                className="bg-brand-gold text-black px-4 py-2 rounded-lg font-bold text-sm"
              >
                + Add Rule
              </button>
            </div>

            {editingReward && (
              <div className="bg-neutral-800 p-6 rounded-xl border border-brand-gold animate-fade-in">
                <form
                  onSubmit={handleSaveReward}
                  className="flex gap-4 items-end"
                >
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-gray-500 uppercase font-bold">
                      Reward Title
                    </label>
                    <input
                      className="w-full bg-neutral-900 p-3 rounded-lg text-white outline-none"
                      placeholder="e.g. Free Drink"
                      value={editingReward.title || ""}
                      onChange={(e) =>
                        setEditingReward((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-xs text-gray-500 uppercase font-bold">
                      Cost (Pts)
                    </label>
                    <input
                      type="number"
                      className="w-full bg-neutral-900 p-3 rounded-lg text-white outline-none"
                      value={editingReward.points_cost || ""}
                      onChange={(e) =>
                        setEditingReward((prev) => ({
                          ...prev,
                          points_cost: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingReward(null)}
                    className="py-3 px-4 bg-neutral-700 rounded-lg text-white font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 bg-green-600 rounded-lg text-white font-bold shadow-lg"
                  >
                    Save
                  </button>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {rewards.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between bg-neutral-800 p-4 rounded-xl border border-neutral-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-brand-gold border border-brand-gold/20 font-bold">
                      {r.points_cost}
                    </div>
                    <div className="font-bold text-white">{r.title}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingReward(r)}
                      className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-white"
                    >
                      <Icon name="menu" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReward(r.id)}
                      className="p-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-lg"
                    >
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {rewards.length === 0 && (
                <p className="text-center text-gray-500 py-10">
                  No reward rules configured.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ... [Rest of Admin tabs - USERS, STATS, BRANDING] ... */}
        {deferredActiveTab === "users" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-bold text-white">User Profiles</h2>

            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full bg-neutral-800 text-white p-3 rounded-xl border border-neutral-700 outline-none focus:border-brand-gold"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles
                .filter(
                  (p) =>
                    p.full_name
                      .toLowerCase()
                      .includes(userSearch.toLowerCase()) ||
                    p.phone.includes(userSearch),
                )
                .map((profile) => (
                  <div
                    key={profile.id}
                    className="bg-neutral-800 p-4 rounded-xl border border-neutral-700 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-full bg-neutral-900 border border-brand-gold/20 flex items-center justify-center text-brand-gold">
                        <Icon name="user" className="w-5 h-5" />
                      </div>
                      <span className="text-brand-gold font-bold text-lg">
                        {profile.points} pts
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-lg leading-tight">
                      {profile.full_name}
                    </h3>
                    <p className="text-gray-400 font-mono text-sm mb-4">
                      {profile.phone}
                    </p>

                    <div className="flex justify-between items-center border-t border-neutral-700 pt-3">
                      <div className="text-xs text-gray-500">
                        Joined{" "}
                        {new Date(
                          profile.created_at || "",
                        ).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => {
                          setResettingUser(profile);
                          setNewPinCode("");
                        }}
                        className="px-3 py-1.5 bg-neutral-700 hover:bg-brand-gold hover:text-black text-gray-300 rounded-lg text-xs font-bold transition-colors"
                      >
                        Reset PIN
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* PIN RESET MODAL */}
            {resettingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-neutral-900 border border-brand-gold w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">
                      Reset User PIN
                    </h3>
                    <button
                      onClick={() => setResettingUser(null)}
                      className="text-gray-500 hover:text-white"
                    >
                      <Icon name="close" className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Set a new 4-digit PIN for{" "}
                    <span className="text-brand-gold font-bold">
                      {resettingUser.full_name}
                    </span>{" "}
                    ({resettingUser.phone}).
                  </p>

                  <form onSubmit={handleUpdatePin} className="space-y-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="Enter new PIN"
                      className="w-full bg-neutral-800 text-white text-center text-2xl tracking-[0.5em] p-3 rounded-xl border border-neutral-700 outline-none focus:border-brand-gold font-mono"
                      value={newPinCode}
                      onChange={(e) =>
                        setNewPinCode(e.target.value.replace(/[^0-9]/g, ""))
                      }
                    />
                    <button
                      type="submit"
                      disabled={saving || newPinCode.length !== 4}
                      className="w-full py-3 bg-brand-gold text-black rounded-xl font-bold shadow-lg hover:bg-yellow-400 disabled:opacity-50"
                    >
                      {saving ? "Updating..." : "Confirm Reset"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {deferredActiveTab === "stats" && (
          <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            {/* Top Level Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">
                    Today's Sales
                  </p>
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                    <Icon name="chart" className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">
                  ${stats.daily.toFixed(2)}
                </p>
              </div>
              <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">
                    Orders Today
                  </p>
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Icon name="clock" className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-brand-gold">
                  {stats.dailyCount}
                </p>
              </div>
              <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">
                    Total Revenue
                  </p>
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                    <Icon name="gift" className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">
                  ${stats.total.toFixed(2)}
                </p>
              </div>
              <div className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700 flex flex-col justify-between h-32">
                <div className="flex justify-between items-start">
                  <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">
                    Total Orders
                  </p>
                  <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                    <Icon name="check" className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-brand-gold">
                  {stats.totalCount}
                </p>
              </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Items Table */}
              <div className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-neutral-700 bg-neutral-800/50">
                  <h3 className="text-lg font-bold text-white">
                    Top Selling Items
                  </h3>
                </div>
                <div className="flex-1 p-0">
                  {topItems.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-neutral-900/30 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="p-4 font-bold tracking-wider">
                            Item Name
                          </th>
                          <th className="p-4 font-bold tracking-wider text-right">
                            Sold
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-700">
                        {topItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-white/5 transition-colors"
                          >
                            <td className="p-4 text-sm font-medium text-gray-200">
                              {item.name}
                            </td>
                            <td className="p-4 text-sm font-bold text-brand-gold text-right">
                              {item.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No data available yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity Stream */}
              <div className="bg-neutral-800 rounded-2xl border border-neutral-700 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-neutral-700 bg-neutral-800/50">
                  <h3 className="text-lg font-bold text-white">
                    Recent Activity
                  </h3>
                </div>
                <div className="flex-1 p-0">
                  {orders.length > 0 ? (
                    <div className="divide-y divide-neutral-700">
                      {orders.slice(0, 6).map((order) => (
                        <div
                          key={order.id}
                          className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-bold text-white">
                              Order #{order.id.slice(0, 6)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-brand-gold">
                              ${Number(order.total_amount).toFixed(2)}
                            </p>
                            <span
                              className={`text-[10px] uppercase font-bold tracking-wider ${order.status === "completed" ? "text-green-500" : "text-yellow-500"}`}
                            >
                              {order.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">
                      No recent orders.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {deferredActiveTab === "branding" && (
          <div className="max-w-md mx-auto text-center space-y-12 pb-20">
            {/* Main App Logo */}
            <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700">
              <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest border-b border-neutral-700 pb-2">
                Main App Logo
              </h3>
              <img
                src={appLogo}
                className="w-40 h-40 mx-auto object-contain mb-6 bg-neutral-900 rounded-full border border-neutral-600"
              />
              <div className="flex gap-4 justify-center">
                <label className="cursor-pointer bg-brand-gold text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-400">
                  Upload Logo
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "logo")}
                  />
                </label>
                <button
                  onClick={() => openAIModal("logo")}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-500"
                >
                  AI Remove BG
                </button>
              </div>
            </div>

            {/* Auth Page Logo */}
            <div className="bg-neutral-800 p-8 rounded-2xl border border-neutral-700">
              <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-widest border-b border-neutral-700 pb-2">
                Auth Page Logo
              </h3>
              <img
                src={authLogo}
                className="w-40 h-40 mx-auto object-cover mb-6 bg-neutral-900 rounded-full border border-neutral-600"
              />
              <div className="flex gap-4 justify-center">
                <label className="cursor-pointer bg-neutral-700 text-white border border-neutral-600 px-6 py-2 rounded-lg font-bold hover:bg-neutral-600 hover:text-white hover:border-brand-gold transition-colors">
                  Upload Auth Logo
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "authLogo")}
                  />
                </label>
                <button
                  onClick={() => openAIModal("authLogo")}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-500"
                >
                  AI Edit
                </button>
              </div>
            </div>

            {/* Save Button Footer */}
            <div
              className={`fixed bottom-6 left-0 right-0 px-6 flex justify-center transition-transform duration-300 ${unsavedBranding ? "translate-y-0" : "translate-y-24"}`}
            >
              <button
                onClick={handleSaveBranding}
                disabled={saving}
                className="bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform"
              >
                {saving ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Icon name="check" className="w-6 h-6" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI MODAL (GENERIC) */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-indigo-500 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              AI Image Editor
            </h3>
            <div className="mb-4">
              {aiResultImage ? (
                <img
                  src={aiResultImage}
                  className="w-full h-64 object-contain bg-neutral-800 rounded-xl"
                />
              ) : (
                <div className="w-full h-64 bg-neutral-800 rounded-xl flex items-center justify-center text-gray-500 border border-dashed border-gray-700">
                  Preview Area
                </div>
              )}
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full bg-neutral-800 text-white p-3 rounded-xl h-24 mb-4 resize-none outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Describe edits (e.g., 'Remove background', 'Add steam', 'Make it brighter')..."
            />
            {aiError && <p className="text-red-400 text-xs mb-4">{aiError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setIsAIModalOpen(false)}
                className="flex-1 py-3 bg-neutral-800 text-white rounded-xl font-bold hover:bg-neutral-700"
              >
                Close
              </button>
              {aiResultImage ? (
                <button
                  onClick={handleAIAccept}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500"
                >
                  Accept
                </button>
              ) : (
                <button
                  onClick={handleAIGenerate}
                  disabled={aiLoading}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 disabled:opacity-50"
                >
                  {aiLoading ? "Processing..." : "Generate"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
