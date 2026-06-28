"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { api } from "@/lib/api"; // Or just use axios directly if needed

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) return;

    setIsSubmitting(true);
    try {
      // Assuming you have a base URL setup, or use relative
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/support/message`, 
        formData
      );
      
      toast.success("We will contact you as soon as possible!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark", // Our Obsidian theme match
        icon: false,
      });

      setTimeout(() => {
        setFormData({ name: "", phone: "", message: "" });
        setIsOpen(false);
        setIsSubmitting(false);
      }, 1500);

    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      toast.error("Failed to send message. Please try again.", { theme: "dark", icon: false });
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#10b981] text-white shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] transition-shadow hover:shadow-[0_0_25px_-2px_rgba(16,185,129,0.7)]"
            aria-label="Open support chat"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "backOut" }}
            className="fixed bottom-6 right-6 z-50 w-full max-w-[340px] overflow-hidden rounded-2xl border border-neutral-800 bg-[#111315] shadow-2xl sm:right-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 bg-[#090a0b] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981]/10 text-[#10b981]">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Attendly Support</h3>
                  <p className="text-[10px] text-[#10b981]">Typically replies in a few minutes</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
              <p className="text-xs text-neutral-400 mb-2">
                Have a question about our pricing or features? Send us a message and we'll get right back to you on WhatsApp.
              </p>
              
              <div>
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-800 bg-[#090a0b] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]/50"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <input
                  type="tel"
                  required
                  placeholder="WhatsApp Number (e.g. 9876543210)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-neutral-800 bg-[#090a0b] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]/50"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <textarea
                  required
                  placeholder="How can we help?"
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full resize-none rounded-lg border border-neutral-800 bg-[#090a0b] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-[#10b981] focus:outline-none focus:ring-1 focus:ring-[#10b981]/50"
                  disabled={isSubmitting}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[#10b981] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#059669] disabled:opacity-80"
              >
                {isSubmitting ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      className="h-full w-1/3 bg-white/20 skew-x-12"
                      animate={{ x: ["-150%", "300%"] }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    />
                  </div>
                ) : (
                  <>
                    Send Message <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastContainer />
    </>
  );
}
