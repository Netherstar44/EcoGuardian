import { apiBase } from "@/lib/queryClient";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import { type PostWithAuthor, type InsertPost, insertPostSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Loader2, Send, Image as ImageIcon, Recycle, Leaf, Trash2, Plus,
  MessageCircle, ChevronDown, ChevronUp, X, Share2, Link2, Check,
  Facebook, Twitter, Smile, Pencil, MoreHorizontal, ChevronLeft, ChevronRight, MapPin,
} from "lucide-react";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


const categories = [
  { id: "limpieza", label: "Limpieza", icon: Trash2 },
  { id: "clasificacion", label: "Clasificación de Residuos", icon: Recycle },
  { id: "compostaje", label: "Compostaje", icon: Leaf },
  { id: "reciclaje", label: "Reciclaje", icon: Recycle },
];

// ─── Reaction facial animation styles ─────────────────────────────────────────
const reactionAnimStyles = `
  /* ── LIKE: thumb rocks up with finger curl ── */
  @keyframes rxn-like-thumb { 0%,100%{transform:rotate(0deg) translateY(0)} 25%{transform:rotate(-18deg) translateY(-1px)} 55%{transform:rotate(12deg) translateY(1px)} 75%{transform:rotate(-8deg) translateY(0)} }
  .rxn-hover-like:hover svg { animation: rxn-like-thumb 0.7s cubic-bezier(.36,.07,.19,.97) infinite; transform-origin: bottom center; }

  /* ── LOVE: heart beats with glow ── */
  @keyframes rxn-love-beat { 0%,100%{transform:scale(1)} 15%{transform:scale(1.22)} 30%{transform:scale(1)} 45%{transform:scale(1.15)} 60%{transform:scale(1)} }
  .rxn-hover-love:hover svg { animation: rxn-love-beat 0.75s ease infinite; transform-origin: center; }

  /* ── CARE: face eyes look up at heart, arms squeeze ── */
  @keyframes rxn-care-eye-l { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-1.5px)} }
  @keyframes rxn-care-eye-r { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-1.5px)} }
  @keyframes rxn-care-heart  { 0%,100%{transform:scale(1) translateY(0)} 40%{transform:scale(1.18) translateY(-1px)} 70%{transform:scale(0.92) translateY(0.5px)} }
  @keyframes rxn-care-arm-l  { 0%,100%{transform:rotate(0deg)} 40%{transform:rotate(-12deg)} 70%{transform:rotate(5deg)} }
  @keyframes rxn-care-arm-r  { 0%,100%{transform:rotate(0deg)} 40%{transform:rotate(12deg)} 70%{transform:rotate(-5deg)} }
  @keyframes rxn-care-smile  { 0%,100%{transform:scaleX(1)} 40%{transform:scaleX(1.1)} }
  .rxn-hover-care:hover .care-eye-l { animation: rxn-care-eye-l 1.1s ease infinite; }
  .rxn-hover-care:hover .care-eye-r { animation: rxn-care-eye-r 1.1s ease infinite 0.05s; }
  .rxn-hover-care:hover .care-heart { animation: rxn-care-heart 0.9s ease infinite; transform-origin: 18px 8px; }
  .rxn-hover-care:hover .care-arm-l { animation: rxn-care-arm-l 1.1s ease infinite; transform-origin: 10px 20px; }
  .rxn-hover-care:hover .care-arm-r { animation: rxn-care-arm-r 1.1s ease infinite; transform-origin: 26px 20px; }
  .rxn-hover-care:hover .care-smile { animation: rxn-care-smile 1.1s ease infinite; transform-origin: 18px 27px; }

  /* ── HAHA: head shakes, eyes squint, tears fall, mouth bounces ── */
  @keyframes rxn-haha-head   { 0%,100%{transform:rotate(0deg)} 20%{transform:rotate(-8deg)} 40%{transform:rotate(9deg)} 60%{transform:rotate(-6deg)} 80%{transform:rotate(5deg)} }
  @keyframes rxn-haha-eye-l  { 0%,100%{transform:scaleY(1) scaleX(1)} 30%{transform:scaleY(0.3) scaleX(1.2)} 60%{transform:scaleY(0.5) scaleX(1.1)} }
  @keyframes rxn-haha-eye-r  { 0%,100%{transform:scaleY(1) scaleX(1)} 25%{transform:scaleY(0.3) scaleX(1.2)} 55%{transform:scaleY(0.5) scaleX(1.1)} }
  @keyframes rxn-haha-mouth  { 0%,100%{transform:scaleY(1) translateY(0)} 30%{transform:scaleY(1.15) translateY(1px)} 60%{transform:scaleY(0.9) translateY(-0.5px)} }
  @keyframes rxn-haha-tear-l { 0%{transform:translateY(0) scaleY(0.3);opacity:0} 20%{opacity:1} 60%{transform:translateY(6px) scaleY(1.4);opacity:0.9} 100%{transform:translateY(11px) scaleY(0.4);opacity:0} }
  @keyframes rxn-haha-tear-r { 0%{transform:translateY(0) scaleY(0.3);opacity:0} 30%{opacity:1} 70%{transform:translateY(6px) scaleY(1.4);opacity:0.9} 100%{transform:translateY(11px) scaleY(0.4);opacity:0} }
  @keyframes rxn-haha-cheek  { 0%,100%{opacity:0.4} 30%{opacity:0.7} 60%{opacity:0.5} }
  .rxn-hover-haha:hover .haha-head  { animation: rxn-haha-head 0.55s cubic-bezier(.36,.07,.19,.97) infinite; transform-origin: 18px 18px; }
  .rxn-hover-haha:hover .haha-eye-l { animation: rxn-haha-eye-l 0.55s ease infinite; transform-origin: 12px 15px; }
  .rxn-hover-haha:hover .haha-eye-r { animation: rxn-haha-eye-r 0.55s ease infinite 0.08s; transform-origin: 24px 15px; }
  .rxn-hover-haha:hover .haha-mouth { animation: rxn-haha-mouth 0.55s ease infinite; transform-origin: 18px 24px; }
  .rxn-hover-haha:hover .haha-tear-l { animation: rxn-haha-tear-l 0.9s ease infinite; transform-origin: 9px 17px; }
  .rxn-hover-haha:hover .haha-tear-r { animation: rxn-haha-tear-r 0.9s ease infinite 0.2s; transform-origin: 27px 17px; }
  .rxn-hover-haha:hover .haha-cheek  { animation: rxn-haha-cheek 0.55s ease infinite; }

  /* ── WOW: eyebrows rise, eyes widen, mouth opens slowly ── */
  @keyframes rxn-wow-brow-l  { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-2.5px)} 70%{transform:translateY(-1.5px)} }
  @keyframes rxn-wow-brow-r  { 0%,100%{transform:translateY(0)} 45%{transform:translateY(-2.5px)} 70%{transform:translateY(-1.5px)} }
  @keyframes rxn-wow-eye-l   { 0%,100%{transform:scale(1)} 40%{transform:scale(1.25)} }
  @keyframes rxn-wow-eye-r   { 0%,100%{transform:scale(1)} 45%{transform:scale(1.25)} }
  @keyframes rxn-wow-mouth   { 0%,100%{transform:scaleY(1)} 40%{transform:scaleY(1.4)} 70%{transform:scaleY(1.2)} }
  @keyframes rxn-wow-pupil-l { 0%,100%{transform:translate(0,0)} 50%{transform:translate(0.5px,-0.8px)} }
  @keyframes rxn-wow-pupil-r { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-0.5px,-0.8px)} }
  @keyframes rxn-wow-sweat   { 0%,60%{transform:translateY(0);opacity:0} 65%{opacity:1} 100%{transform:translateY(5px);opacity:0} }
  .rxn-hover-wow:hover .wow-brow-l { animation: rxn-wow-brow-l 1.2s ease infinite; }
  .rxn-hover-wow:hover .wow-brow-r { animation: rxn-wow-brow-r 1.2s ease infinite 0.06s; }
  .rxn-hover-wow:hover .wow-eye-l  { animation: rxn-wow-eye-l 1.2s ease infinite; transform-origin: 12.5px 17px; }
  .rxn-hover-wow:hover .wow-eye-r  { animation: rxn-wow-eye-r 1.2s ease infinite 0.06s; transform-origin: 23.5px 17px; }
  .rxn-hover-wow:hover .wow-mouth  { animation: rxn-wow-mouth 1.2s ease infinite; transform-origin: 18px 26px; }
  .rxn-hover-wow:hover .wow-pupil-l{ animation: rxn-wow-pupil-l 1.2s ease infinite; }
  .rxn-hover-wow:hover .wow-pupil-r{ animation: rxn-wow-pupil-r 1.2s ease infinite; }
  .rxn-hover-wow:hover .wow-sweat  { animation: rxn-wow-sweat 1.8s ease infinite 0.6s; }

  /* ── SAD: eyebrows droop, eyes water, mouth curves down, tear drops ── */
  @keyframes rxn-sad-brow-l  { 0%,100%{transform:rotate(0deg) translateY(0)} 50%{transform:rotate(12deg) translateY(1.5px)} }
  @keyframes rxn-sad-brow-r  { 0%,100%{transform:rotate(0deg) translateY(0)} 50%{transform:rotate(-12deg) translateY(1.5px)} }
  @keyframes rxn-sad-eye-l   { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.75)} }
  @keyframes rxn-sad-eye-r   { 0%,100%{transform:scaleY(1)} 55%{transform:scaleY(0.75)} }
  @keyframes rxn-sad-tear-l  { 0%,40%{transform:translateY(0);opacity:0} 45%{opacity:0.9} 90%{transform:translateY(8px);opacity:0.4} 100%{transform:translateY(10px);opacity:0} }
  @keyframes rxn-sad-tear-r  { 0%,55%{transform:translateY(0);opacity:0} 60%{opacity:0.9} 100%{transform:translateY(8px);opacity:0} }
  @keyframes rxn-sad-face    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(1px)} }
  .rxn-hover-sad:hover .sad-brow-l { animation: rxn-sad-brow-l 1.6s ease infinite; transform-origin: 8px 12px; }
  .rxn-hover-sad:hover .sad-brow-r { animation: rxn-sad-brow-r 1.6s ease infinite 0.1s; transform-origin: 28px 12px; }
  .rxn-hover-sad:hover .sad-eye-l  { animation: rxn-sad-eye-l 1.6s ease infinite; transform-origin: 12px 17.5px; }
  .rxn-hover-sad:hover .sad-eye-r  { animation: rxn-sad-eye-r 1.6s ease infinite 0.1s; transform-origin: 24px 17.5px; }
  .rxn-hover-sad:hover .sad-mouth  { animation: rxn-sad-mouth 1.6s ease infinite; }
  .rxn-hover-sad:hover .sad-tear-l { animation: rxn-sad-tear-l 2s ease infinite; transform-origin: 12px 19px; }
  .rxn-hover-sad:hover .sad-tear-r { animation: rxn-sad-tear-r 2s ease infinite 0.5s; transform-origin: 24px 19px; }
  .rxn-hover-sad:hover .sad-face   { animation: rxn-sad-face 1.6s ease infinite; }

  /* ── ANGRY: veins pulse, brows slam down, eyes narrow, face reddens, steam ── */
  @keyframes rxn-angry-face  { 0%,100%{transform:scale(1)} 30%{transform:scale(1.04)} 60%{transform:scale(0.98)} }
  @keyframes rxn-angry-brow-l{ 0%,100%{transform:rotate(0deg) translateY(0)} 40%{transform:rotate(20deg) translateY(2px)} 70%{transform:rotate(15deg) translateY(1.5px)} }
  @keyframes rxn-angry-brow-r{ 0%,100%{transform:rotate(0deg) translateY(0)} 40%{transform:rotate(-20deg) translateY(2px)} 70%{transform:rotate(-15deg) translateY(1.5px)} }
  @keyframes rxn-angry-eye-l { 0%,100%{transform:scaleY(1)} 35%{transform:scaleY(0.5)} 65%{transform:scaleY(0.65)} }
  @keyframes rxn-angry-eye-r { 0%,100%{transform:scaleY(1)} 40%{transform:scaleY(0.5)} 70%{transform:scaleY(0.65)} }
  @keyframes rxn-angry-vein  { 0%,100%{opacity:0;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.1)} }
  @keyframes rxn-angry-steam-l{ 0%{transform:translateY(0) scaleX(1);opacity:0} 20%{opacity:0.8} 100%{transform:translateY(-8px) scaleX(0.5);opacity:0} }
  @keyframes rxn-angry-steam-r{ 0%{transform:translateY(0) scaleX(1);opacity:0} 30%{opacity:0.8} 100%{transform:translateY(-8px) scaleX(0.5);opacity:0} }
  @keyframes rxn-angry-mouth { 0%,100%{transform:scaleX(1)} 50%{transform:scaleX(1.08)} }
  @keyframes rxn-angry-glow  { 0%,100%{opacity:0.15} 50%{opacity:0.35} }
  .rxn-hover-angry:hover .angry-face  { animation: rxn-angry-face 0.5s ease infinite; transform-origin: 18px 19px; }
  .rxn-hover-angry:hover .angry-brow-l{ animation: rxn-angry-brow-l 0.5s ease infinite; transform-origin: 11px 14px; }
  .rxn-hover-angry:hover .angry-brow-r{ animation: rxn-angry-brow-r 0.5s ease infinite 0.04s; transform-origin: 25px 14px; }
  .rxn-hover-angry:hover .angry-eye-l { animation: rxn-angry-eye-l 0.5s ease infinite; transform-origin: 12px 18px; }
  .rxn-hover-angry:hover .angry-eye-r { animation: rxn-angry-eye-r 0.5s ease infinite 0.04s; transform-origin: 24px 18px; }
  .rxn-hover-angry:hover .angry-vein  { animation: rxn-angry-vein 0.9s ease infinite; }
  .rxn-hover-angry:hover .angry-steam-l{ animation: rxn-angry-steam-l 1s ease infinite 0.1s; }
  .rxn-hover-angry:hover .angry-steam-r{ animation: rxn-angry-steam-r 1s ease infinite 0.35s; }
  .rxn-hover-angry:hover .angry-mouth { animation: rxn-angry-mouth 0.5s ease infinite; transform-origin: 18px 25px; }
  .rxn-hover-angry:hover .angry-glow  { animation: rxn-angry-glow 0.5s ease infinite; }
`;

// ─── Custom SVG reaction icons (fully animated on hover) ──────────────────────
const ReactionIcons: Record<string, (props: { size?: number; color?: string }) => JSX.Element> = {
  like: ({ size = 22, color = "#1877F2" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7 22V11M2 13v7a2 2 0 002 2h11.5a2 2 0 001.97-1.67l1.1-7A2 2 0 0016.6 11H13V6a3 3 0 00-3-3L7 11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  love: ({ size = 22, color = "#F33E58" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 21C12 21 3 15 3 8.5a5 5 0 019-3 5 5 0 019 3C21 15 12 21 12 21z" fill={color} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

  /* ══════════════════════════════════════════════════════
     ME IMPORTA — cara tierna amarilla suave con corazón
     colores: #FFD93D cara, #FF6B6B corazón, mejillas #FFAA8A
  ══════════════════════════════════════════════════════ */
  care: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="care-face-g" cx="42%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE566"/>
          <stop offset="100%" stopColor="#FFCC2E"/>
        </radialGradient>
        <radialGradient id="care-heart-g" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#FF8FA3"/>
          <stop offset="100%" stopColor="#E8335A"/>
        </radialGradient>
      </defs>
      {/* cara redonda suave */}
      <circle cx="18" cy="20" r="13" fill="url(#care-face-g)"/>
      {/* brillo cara */}
      <ellipse cx="13" cy="14" rx="4" ry="2.5" fill="#fff" opacity="0.18"/>
      {/* mejillas dulces */}
      <ellipse cx="9" cy="23" rx="3.5" ry="2" fill="#FFB347" opacity="0.38"/>
      <ellipse cx="27" cy="23" rx="3.5" ry="2" fill="#FFB347" opacity="0.38"/>
      {/* ojo izquierdo — con mirada cálida */}
      <g className="care-eye-l">
        <ellipse cx="13" cy="19.5" rx="2.5" ry="2.8" fill="#fff"/>
        <ellipse cx="13" cy="18.8" rx="1.4" ry="1.6" fill="#3E2000"/>
        <circle cx="13.7" cy="18.2" r="0.55" fill="#fff"/>
        <ellipse cx="13" cy="22" rx="2" ry="0.5" fill="#FFB347" opacity="0.25"/>
      </g>
      {/* ojo derecho */}
      <g className="care-eye-r">
        <ellipse cx="23" cy="19.5" rx="2.5" ry="2.8" fill="#fff"/>
        <ellipse cx="23" cy="18.8" rx="1.4" ry="1.6" fill="#3E2000"/>
        <circle cx="23.7" cy="18.2" r="0.55" fill="#fff"/>
        <ellipse cx="23" cy="22" rx="2" ry="0.5" fill="#FFB347" opacity="0.25"/>
      </g>
      {/* sonrisa suave */}
      <g className="care-smile">
        <path d="M12 25.5 Q18 30 24 25.5" stroke="#C47A00" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </g>
      {/* corazón flotante bonito */}
      <g className="care-heart">
        <path d="M18 13 C18 13 12.5 9 12.5 5.8 a3.2 3.2 0 0 1 5.5-.5 a3.2 3.2 0 0 1 5.5.5 C23.5 9 18 13 18 13Z" fill="url(#care-heart-g)"/>
        <ellipse cx="15.5" cy="5.8" rx="1.2" ry="0.7" fill="#fff" opacity="0.5" transform="rotate(-25 15.5 5.8)"/>
      </g>
      {/* bracito izquierdo redondeado */}
      <g className="care-arm-l">
        <path d="M8 17 C5.5 15 3.5 16.5 4 19 C4.5 21.5 7 22 9.5 20.5" stroke="#FFCC2E" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
        <path d="M8 17 C5.5 15 3.5 16.5 4 19 C4.5 21.5 7 22 9.5 20.5" stroke="#E8A800" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
      </g>
      {/* bracito derecho redondeado */}
      <g className="care-arm-r">
        <path d="M28 17 C30.5 15 32.5 16.5 32 19 C31.5 21.5 29 22 26.5 20.5" stroke="#FFCC2E" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
        <path d="M28 17 C30.5 15 32.5 16.5 32 19 C31.5 21.5 29 22 26.5 20.5" stroke="#E8A800" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
      </g>
    </svg>
  ),

  /* ══════════════════════════════════════════════════════
     ME DIVIERTE — cara riendo a carcajadas, ojos cerrados
     colores: #FFD93D cara, ojos en arco, boca naranja cálido
  ══════════════════════════════════════════════════════ */
  haha: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="haha-face-g" cx="42%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE566"/>
          <stop offset="100%" stopColor="#FFC200"/>
        </radialGradient>
        <radialGradient id="haha-mouth-g" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#A0522D"/>
          <stop offset="100%" stopColor="#5C2A00"/>
        </radialGradient>
      </defs>
      {/* toda la cabeza se balancea en hover */}
      <g className="haha-head">
        {/* cara redonda cálida */}
        <circle cx="18" cy="18" r="15" fill="url(#haha-face-g)"/>
        <ellipse cx="13" cy="11" rx="5" ry="3" fill="#fff" opacity="0.15"/>
        {/* mejillas sonrojadas suaves */}
        <ellipse cx="7.5" cy="21" rx="4" ry="2.2" fill="#FF9060" className="haha-cheek" opacity="0.42"/>
        <ellipse cx="28.5" cy="21" rx="4" ry="2.2" fill="#FF9060" className="haha-cheek" opacity="0.42"/>
        {/* ojo izquierdo cerrado — arco feliz */}
        <g className="haha-eye-l">
          <ellipse cx="12" cy="15" rx="3.5" ry="2.5" fill="#fff" opacity="0.9"/>
          <path d="M9 15.8 Q12 12.5 15 15.8" stroke="#3E2000" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </g>
        {/* ojo derecho cerrado — arco feliz */}
        <g className="haha-eye-r">
          <ellipse cx="24" cy="15" rx="3.5" ry="2.5" fill="#fff" opacity="0.9"/>
          <path d="M21 15.8 Q24 12.5 27 15.8" stroke="#3E2000" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </g>
        {/* lágrima izquierda — gota bonita */}
        <g className="haha-tear-l">
          <path d="M9 18 Q8 16 9 14.5 Q10 16 9 18Z" fill="#7EC8F0"/>
          <ellipse cx="8.7" cy="15.5" rx="0.55" ry="0.4" fill="#fff" opacity="0.7"/>
        </g>
        {/* lágrima derecha */}
        <g className="haha-tear-r">
          <path d="M27 18 Q26 16 27 14.5 Q28 16 27 18Z" fill="#7EC8F0"/>
          <ellipse cx="26.7" cy="15.5" rx="0.55" ry="0.4" fill="#fff" opacity="0.7"/>
        </g>
        {/* boca abierta riendo — bonita y redondeada */}
        <g className="haha-mouth">
          <path d="M8 22 Q18 33 28 22" fill="url(#haha-mouth-g)"/>
          {/* dientes blancos con separaciones suaves */}
          <rect x="11.5" y="22" width="13" height="4" rx="1.5" fill="#fff"/>
          <line x1="18" y1="22" x2="18" y2="26" stroke="#EEE" strokeWidth="0.7"/>
          <line x1="14.5" y1="22" x2="14.5" y2="26" stroke="#EEE" strokeWidth="0.6"/>
          <line x1="21.5" y1="22" x2="21.5" y2="26" stroke="#EEE" strokeWidth="0.6"/>
          {/* lengua rosada suave */}
          <ellipse cx="18" cy="27.5" rx="4.5" ry="2.5" fill="#FF7BAC"/>
          <ellipse cx="18" cy="26.8" rx="2" ry="0.6" fill="#E8569A" opacity="0.35"/>
        </g>
      </g>
    </svg>
  ),

  /* ══════════════════════════════════════════════════════
     ME ASOMBRA — cara sorprendida dulce, ojos grandes
     colores: #FFD93D cara, ojos redondos expresivos, boca en O
  ══════════════════════════════════════════════════════ */
  wow: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="wow-face-g" cx="42%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFE566"/>
          <stop offset="100%" stopColor="#FFCC2E"/>
        </radialGradient>
        <radialGradient id="wow-eye-g" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#4A90D9"/>
          <stop offset="100%" stopColor="#1A5FAB"/>
        </radialGradient>
      </defs>
      {/* cara */}
      <circle cx="18" cy="19" r="14" fill="url(#wow-face-g)"/>
      <ellipse cx="13" cy="12" rx="5" ry="2.5" fill="#fff" opacity="0.18"/>
      {/* ceja izquierda arqueada sorpresa */}
      <g className="wow-brow-l">
        <path d="M9 11.5 Q12.5 9 16 11" stroke="#7A4500" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </g>
      {/* ceja derecha arqueada */}
      <g className="wow-brow-r">
        <path d="M20 11 Q23.5 9 27 11.5" stroke="#7A4500" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </g>
      {/* ojo izquierdo — grande expresivo */}
      <g className="wow-eye-l">
        <ellipse cx="12.5" cy="17" rx="3.8" ry="4" fill="#fff"/>
        <ellipse cx="12.5" cy="17" rx="3.8" ry="4" stroke="#E8A800" strokeWidth="0.6" fill="none"/>
        <ellipse cx="12.5" cy="17.2" rx="2.3" ry="2.4" fill="url(#wow-eye-g)" className="wow-pupil-l"/>
        <ellipse cx="12.5" cy="17.2" rx="1.3" ry="1.4" fill="#0D1A2E"/>
        <circle cx="13.4" cy="16.2" r="0.7" fill="#fff"/>
        <circle cx="11.9" cy="17.8" r="0.35" fill="#fff" opacity="0.5"/>
      </g>
      {/* ojo derecho — grande expresivo */}
      <g className="wow-eye-r">
        <ellipse cx="23.5" cy="17" rx="3.8" ry="4" fill="#fff"/>
        <ellipse cx="23.5" cy="17" rx="3.8" ry="4" stroke="#E8A800" strokeWidth="0.6" fill="none"/>
        <ellipse cx="23.5" cy="17.2" rx="2.3" ry="2.4" fill="url(#wow-eye-g)" className="wow-pupil-r"/>
        <ellipse cx="23.5" cy="17.2" rx="1.3" ry="1.4" fill="#0D1A2E"/>
        <circle cx="24.4" cy="16.2" r="0.7" fill="#fff"/>
        <circle cx="22.9" cy="17.8" r="0.35" fill="#fff" opacity="0.5"/>
      </g>
      {/* boca en O suave */}
      <g className="wow-mouth">
        <ellipse cx="18" cy="26" rx="3.8" ry="4.2" fill="#7A4500"/>
        <ellipse cx="18" cy="24.2" rx="2.8" ry="1.6" fill="#A0622A" opacity="0.5"/>
        <ellipse cx="18" cy="26" rx="2.2" ry="2.5" fill="#5C3000" opacity="0.4"/>
      </g>
      {/* gotita de asombro — elegante */}
      <g className="wow-sweat">
        <path d="M30 9 Q29.3 7 30 5.5 Q30.7 7 30 9Z" fill="#7EC8F0"/>
        <ellipse cx="29.7" cy="6.8" rx="0.4" ry="0.3" fill="#fff" opacity="0.7"/>
      </g>
    </svg>
  ),

  /* ══════════════════════════════════════════════════════
     ME ENTRISTECE — azul suave, cejas caídas, lágrimas
     colores: #9EC4DC cara, #B8D8F0 base, lágrimas #7EC8F0
  ══════════════════════════════════════════════════════ */
  sad: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="sad-face-g" cx="42%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#B8D8F0"/>
          <stop offset="100%" stopColor="#7AAED4"/>
        </radialGradient>
        <radialGradient id="sad-eye-g" cx="35%" cy="28%" r="60%">
          <stop offset="0%" stopColor="#4A7FB5"/>
          <stop offset="100%" stopColor="#1A4E82"/>
        </radialGradient>
      </defs>
      {/* cara azul suave */}
      <g className="sad-face">
        <circle cx="18" cy="19" r="14" fill="url(#sad-face-g)"/>
        <ellipse cx="13" cy="12" rx="5" ry="2.5" fill="#fff" opacity="0.2"/>
        {/* mejillas pálidas */}
        <ellipse cx="9" cy="24" rx="3.5" ry="1.8" fill="#6B9FD4" opacity="0.28"/>
        <ellipse cx="27" cy="24" rx="3.5" ry="1.8" fill="#6B9FD4" opacity="0.28"/>
      </g>
      {/* ceja izquierda — se dobla triste */}
      <g className="sad-brow-l">
        <path d="M8 12 Q11.5 15 15 13" stroke="#2E608A" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </g>
      {/* ceja derecha */}
      <g className="sad-brow-r">
        <path d="M21 13 Q24.5 15 28 12" stroke="#2E608A" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </g>
      {/* ojo izquierdo — suave con lagrimita acumulada */}
      <g className="sad-eye-l">
        <ellipse cx="12" cy="17.5" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="12" cy="17.8" rx="1.8" ry="1.8" fill="url(#sad-eye-g)"/>
        <ellipse cx="12" cy="17.8" rx="1" ry="1" fill="#0D2A47"/>
        <circle cx="12.8" cy="17" r="0.6" fill="#fff"/>
        {/* lagrimita acumulada abajo */}
        <ellipse cx="12" cy="20.2" rx="2.2" ry="0.7" fill="#7EC8F0" opacity="0.55"/>
      </g>
      {/* ojo derecho */}
      <g className="sad-eye-r">
        <ellipse cx="24" cy="17.5" rx="3" ry="3" fill="#fff"/>
        <ellipse cx="24" cy="17.8" rx="1.8" ry="1.8" fill="url(#sad-eye-g)"/>
        <ellipse cx="24" cy="17.8" rx="1" ry="1" fill="#0D2A47"/>
        <circle cx="24.8" cy="17" r="0.6" fill="#fff"/>
        <ellipse cx="24" cy="20.2" rx="2.2" ry="0.7" fill="#7EC8F0" opacity="0.55"/>
      </g>
      {/* boca triste curvada suavemente */}
      <g className="sad-mouth">
        <path d="M10 26 Q18 21.5 26 26" stroke="#2E608A" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </g>
      {/* lágrima izquierda — gota bonita */}
      <g className="sad-tear-l">
        <path d="M12 21.5 Q11 19 12 17 Q13 19 12 21.5Z" fill="#7EC8F0"/>
        <ellipse cx="11.7" cy="18.5" rx="0.5" ry="0.4" fill="#fff" opacity="0.65"/>
      </g>
      {/* lágrima derecha */}
      <g className="sad-tear-r">
        <path d="M24 21.5 Q23 19 24 17 Q25 19 24 21.5Z" fill="#7EC8F0"/>
        <ellipse cx="23.7" cy="18.5" rx="0.5" ry="0.4" fill="#fff" opacity="0.65"/>
      </g>
    </svg>
  ),

  /* ══════════════════════════════════════════════════════
     ME ENOJA — rojo cálido (NO terrorífico), cejas en V
     colores: #FF6B47 cara, #FF4500 más intenso, expresión clara
  ══════════════════════════════════════════════════════ */
  angry: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="angry-face-g" cx="42%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FF8C5A"/>
          <stop offset="100%" stopColor="#E84000"/>
        </radialGradient>
        <radialGradient id="angry-eye-g" cx="35%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#8B3000"/>
          <stop offset="100%" stopColor="#3A0000"/>
        </radialGradient>
      </defs>
      {/* glow naranja suave — pulsa */}
      <circle cx="18" cy="19" r="15.5" fill="#FF8C5A" className="angry-glow" opacity="0.2"/>
      {/* cara roja cálida */}
      <g className="angry-face">
        <circle cx="18" cy="19" r="13.5" fill="url(#angry-face-g)"/>
        <ellipse cx="13" cy="12" rx="5" ry="2.5" fill="#fff" opacity="0.12"/>
        {/* mejillas más intensas */}
        <ellipse cx="8.5" cy="23" rx="3.8" ry="2" fill="#C43000" opacity="0.35"/>
        <ellipse cx="27.5" cy="23" rx="3.8" ry="2" fill="#C43000" opacity="0.35"/>
      </g>
      {/* ceja izquierda — en diagonal hacia adentro, expresiva */}
      <g className="angry-brow-l">
        <path d="M7.5 13 Q11 15.5 14.5 14" stroke="#6B1000" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      </g>
      {/* ceja derecha — en diagonal hacia adentro */}
      <g className="angry-brow-r">
        <path d="M21.5 14 Q25 15.5 28.5 13" stroke="#6B1000" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
      </g>
      {/* ojo izquierdo entrecerrado con estilo */}
      <g className="angry-eye-l">
        <ellipse cx="12" cy="19" rx="3.2" ry="2.8" fill="#fff"/>
        <ellipse cx="12" cy="19.3" rx="2" ry="1.8" fill="url(#angry-eye-g)"/>
        <ellipse cx="12" cy="19.3" rx="1.1" ry="1" fill="#1A0000"/>
        <circle cx="12.8" cy="18.6" r="0.5" fill="#fff"/>
        {/* párpado superior */}
        <path d="M8.8 17 Q12 15.5 15.2 17" fill="#E84000"/>
      </g>
      {/* ojo derecho entrecerrado */}
      <g className="angry-eye-r">
        <ellipse cx="24" cy="19" rx="3.2" ry="2.8" fill="#fff"/>
        <ellipse cx="24" cy="19.3" rx="2" ry="1.8" fill="url(#angry-eye-g)"/>
        <ellipse cx="24" cy="19.3" rx="1.1" ry="1" fill="#1A0000"/>
        <circle cx="24.8" cy="18.6" r="0.5" fill="#fff"/>
        <path d="M20.8 17 Q24 15.5 27.2 17" fill="#E84000"/>
      </g>
      {/* boca apretada — expresiva pero no horrible */}
      <g className="angry-mouth">
        <path d="M10 26.5 Q18 22.5 26 26.5" stroke="#6B1000" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        {/* pequeños dientes apretados */}
        <path d="M13 26 Q18 23.5 23 26" fill="#fff" opacity="0.85"/>
      </g>
      {/* vena pequeña discreta — pulsa */}
      <g className="angry-vein">
        <path d="M24 9.5 L25.2 8 L26.2 9.5 L27.5 7.5" stroke="#8B2000" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </g>
      {/* vapor izquierdo */}
      <g className="angry-steam-l">
        <path d="M9 10 Q8.2 8 9 6.5" stroke="#FFB08C" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </g>
      {/* vapor derecho */}
      <g className="angry-steam-r">
        <path d="M12 8.5 Q11.2 6.5 12 5" stroke="#FFB08C" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </g>
    </svg>
  ),
};

// helper for uploading images; used by Community and PostMenu
async function uploadImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1] || dataUrl;
        const res = await fetch(apiBase + "/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ imageBase64: base64 }),
        });
        if (!res.ok) {
          const err = await res.text();
          reject(new Error("Upload failed " + res.status + ": " + err));
          return;
        }
        const data = await res.json();
        resolve(data.url || data.secure_url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

const reactions = [
  { id: "like",  label: "Me gusta",      color: "#1877F2" },
  { id: "love",  label: "Me encanta",    color: "#F33E58" },
  { id: "care",  label: "Me importa",    color: "#F7B125" },
  { id: "haha",  label: "Me divierte",   color: "#F7B125" },
  { id: "wow",   label: "Me asombra",    color: "#F59E0B" },
  { id: "sad",   label: "Me entristece", color: "#6B9FD4" },
  { id: "angry", label: "Me enoja",      color: "#E9710F" },
];

type SortOption = "new" | "old" | "relevant";

export default function Community() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>("new");
  // Multi-image: previews are data URLs for display; uploadedUrls tracks Cloudinary URLs
  const [previewImages, setPreviewImages] = useState<{ dataUrl: string; cloudUrl: string | null }[]>([]);
  const [location, setLocation] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const d = await r.json();
          const addr = d.address;
          const label = addr.city || addr.town || addr.village || addr.municipality || addr.county || "Ubicación";
          const country = addr.country || "";
          setLocation(`${label}${country ? ", " + country : ""}`);
        } catch {
          setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        }
        setGettingLocation(false);
      },
      () => { setGettingLocation(false); }
    );
  };

  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: [api.posts.list.path],
  });

  const form = useForm<InsertPost>({
    resolver: zodResolver(insertPostSchema as any),
    defaultValues: { content: "", category: "reciclaje" },
  });

  const [fileInputRef] = useState(() => React.createRef<HTMLInputElement>());

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 10 - previewImages.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach(file => {
      // Generate local preview first
      const localUrl = URL.createObjectURL(file);
      const key = localUrl; // use object URL as stable key
      setPreviewImages(prev => [...prev, { dataUrl: localUrl, cloudUrl: null }]);
      uploadImageFile(file)
        .then(cloudUrl => {
          setPreviewImages(prev => prev.map(p => p.dataUrl === key ? { dataUrl: localUrl, cloudUrl } : p));
        })
        .catch(err => {
          console.error("[UPLOAD ERROR]", err);
          setPreviewImages(prev => prev.filter(p => p.dataUrl !== key));
        });
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePreviewImage = (idx: number) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: async (values: InsertPost) => {
      // Only include images that finished uploading
      const imageUrls = previewImages
        .filter(p => p.cloudUrl !== null)
        .map(p => p.cloudUrl as string);
      await apiRequest(api.posts.create.method, api.posts.create.path, {
        ...values,
        imageUrls,
        location: location || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      form.reset();
      setPreviewImages([]);
      setLocation(null);
      setIsDialogOpen(false);
      toast({ title: "¡Publicado!", description: "Tu aporte ambiental ha sido compartido con la comunidad." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo publicar. ¿Estás conectado?" });
    },
  });

  const sortedPosts = React.useMemo(() => {
    if (!posts) return [];
    const copy = [...posts];
    if (sort === "new") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === "old") return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, sort]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <style>{reactionAnimStyles}</style>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Comunidad Eco-Activa</h1>
        <p className="text-muted-foreground text-lg mb-8">Comparte tus labores, consejos y experiencias cuidando nuestro entorno.</p>

        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) { form.reset(); setPreviewImages([]); setLocation(null); } }}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Plus className="h-5 w-5" />
              Publicar contenido
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Compartir labor ambiental</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <div className="flex items-center gap-2">
                                <cat.icon className="h-4 w-4" />
                                {cat.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Comparte cómo clasificaste tus residuos, tu proceso de compostaje o tu jornada de limpieza..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Compact image preview strip */}
                {previewImages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewImages.map((img, idx) => (
                      <div key={idx} className="relative group flex-shrink-0">
                        <div className="h-16 w-16 rounded-xl overflow-hidden border-2 border-border bg-black">
                          <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                          {img.cloudUrl === null && (
                            <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                              <Loader2 className="h-4 w-4 animate-spin text-white" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removePreviewImage(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-foreground text-background rounded-full p-0.5 shadow-sm hover:bg-foreground/80 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {previewImages.length < 10 && (
                      <button
                        type="button"
                        onClick={handlePickImage}
                        className="h-16 w-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors flex-shrink-0"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Location tag */}
                {location && (
                  <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/10 rounded-full px-3 py-1 w-fit">
                    <MapPin className="h-3 w-3" />
                    <span>{location}</span>
                    <button type="button" onClick={() => setLocation(null)} className="ml-1 hover:text-primary/60">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {/* Action bar */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                    <button
                      type="button"
                      onClick={handlePickImage}
                      disabled={previewImages.length >= 10}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40"
                    >
                      <ImageIcon className="h-4 w-4 text-green-500" />
                      Foto
                    </button>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={gettingLocation}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin text-red-400" /> : <MapPin className="h-4 w-4 text-red-400" />}
                      Ubicación
                    </button>
                  </div>
                  <Button type="submit" disabled={mutation.isPending} size="sm" className="rounded-full gap-2">
                    {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Publicar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </motion.div>



      <div className="space-y-6">
        <AnimatePresence>
          {sortedPosts.map((post) => (
            <motion.div key={post.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} layout>
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {post.author.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h3 className="font-semibold text-foreground">{post.author.name}</h3>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.createdAt), "d 'de' MMMM", { locale: es })}
                        </span>
                        {(post as any).editedAt && <span className="text-[10px] text-muted-foreground italic">(editado)</span>}
                        <PostMenu post={post} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                        {post.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Leaf className="h-3 w-3" />
                        {post.author.points} puntos
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const loc = post.content.match(/\n\n📍 (.+)$/);
                    const text = loc ? post.content.replace(/\n\n📍 .+$/, '') : post.content;
                    return (
                      <>
                        <p className="whitespace-pre-wrap text-foreground/90 break-words overflow-hidden">{text}</p>
                        {loc && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-primary bg-primary/10 rounded-full px-2.5 py-1 w-fit">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span>{loc[1]}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <PostImageGallery imageUrl={post.imageUrl} />
                </CardContent>
                <CardFooter className="bg-muted/30 pt-2 pb-2 flex flex-col gap-0 overflow-visible">
                  <PostFooter post={post} />
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {sortedPosts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Leaf className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aún no hay publicaciones. ¡Sé el primero en compartir!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Image Gallery + Lightbox (Facebook-style) ───────────────────────────────
function PostImageGallery({ imageUrl }: { imageUrl: string | null | undefined }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  if (!imageUrl) return null;

  // Parse: may be JSON array of URLs or a single URL string
  let urls: string[] = [];
  try {
    const parsed = JSON.parse(imageUrl);
    urls = Array.isArray(parsed) ? parsed : [imageUrl];
  } catch {
    urls = [imageUrl];
  }

  const n = urls.length;

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prev = () => setLightboxIdx(i => (i === null ? 0 : (i - 1 + n) % n));
  const next = () => setLightboxIdx(i => (i === null ? 0 : (i + 1) % n));

  // Keyboard navigation
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIdx]);

  // Grid layouts matching Facebook
  const gridClass =
    n === 1 ? "grid-cols-1" :
    n === 2 ? "grid-cols-2" :
    n === 3 ? "grid-cols-3" :
    "grid-cols-2";

  const visibleUrls = n > 4 ? urls.slice(0, 4) : urls;
  const hiddenCount = n > 4 ? n - 4 : 0;

  return (
    <>
      <div className={`mt-3 grid gap-0.5 rounded-xl overflow-hidden ${gridClass}`}>
        {visibleUrls.map((src, idx) => {
          const isLast = hiddenCount > 0 && idx === visibleUrls.length - 1;
          // Single image: natural aspect ratio, blurred background, max height
          if (n === 1) {
            return (
              <div
                key={idx}
                className="relative w-full bg-black flex items-center justify-center cursor-pointer overflow-hidden"
                style={{ maxHeight: "min(420px, 85vw)", minHeight: 80 }}
                onClick={() => openLightbox(idx)}
              >
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${src})`, filter: "blur(20px) brightness(0.45)", transform: "scale(1.15)" }} />
                <img src={src} alt="" className="relative z-10 w-full object-contain" style={{ maxHeight: "min(420px, 85vw)", display: "block" }} />
              </div>
            );
          }
          // Multi-image: aspect-ratio tiles so they never stretch
          // On mobile (small screens) use taller ratio, on PC use shorter
          const aspectClass = n === 2 ? "aspect-[3/2] sm:aspect-[4/3]" : "aspect-square sm:aspect-[5/4]";
          return (
            <div
              key={idx}
              className={`relative cursor-pointer overflow-hidden bg-black group ${aspectClass}`}
              onClick={() => openLightbox(idx)}
            >
              <img src={src} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
              {isLast && hiddenCount > 0 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{hiddenCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox portal */}
      {lightboxIdx !== null && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 z-10 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          {n > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 px-3 py-1 rounded-full">
              {lightboxIdx + 1} / {n}
            </div>
          )}

          {/* Prev */}
          {n > 1 && (
            <button
              onClick={e => { e.stopPropagation(); prev(); }}
              className="absolute left-3 text-white bg-white/10 hover:bg-white/25 rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Image */}
          <motion.img
            key={lightboxIdx}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            src={urls[lightboxIdx]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          {n > 1 && (
            <button
              onClick={e => { e.stopPropagation(); next(); }}
              className="absolute right-3 text-white bg-white/10 hover:bg-white/25 rounded-full p-2 transition-colors"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {/* Thumbnail strip for 3+ images */}
          {n > 2 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {urls.map((src, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIdx(i); }}
                  className={`h-10 w-10 rounded-md overflow-hidden border-2 transition-all ${i === lightboxIdx ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>,
        document.body
      )}
    </>
  );
}

// ─── Post Menu (Edit/Delete) ──────────────────────────────────────────────────
function PostMenu({ post }: { post: any }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  // parse stored imageUrl (may be JSON array or single URL)
  const parseImageUrls = (raw: string | null): string[] => {
    if (!raw) return [];
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [raw]; } catch { return [raw]; }
  };
  // editImageUrls: Cloudinary URLs (existing or newly uploaded)
  const [editImageUrls, setEditImageUrls] = useState<string[]>(parseImageUrls(post.imageUrl));
  const editFileRef = useRef<HTMLInputElement>(null);
  // uploading state per new image (index among newly added ones)
  const [editUploading, setEditUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const deletePost = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      toast({ title: "Publicación eliminada" });
      setConfirmDelete(false);
    },
    onError: () => toast({ variant: "destructive", title: "Error al eliminar" }),
  });

  const editPost = useMutation({
    mutationFn: async () => {
      // editImageUrls only contains real Cloudinary URLs at this point
      await apiRequest("PATCH", `/api/posts/${post.id}`, {
        content: editContent,
        imageUrls: editImageUrls,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.posts.list.path] });
      setEditing(false);
      setOpen(false);
      toast({ title: "Publicación editada" });
    },
    onError: () => toast({ variant: "destructive", title: "Error al editar" }),
  });

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - editImageUrls.length;
    const toAdd = files.slice(0, remaining);
    if (!toAdd.length) return;
    setEditUploading(true);
    let done = 0;
    toAdd.forEach(file => {
      uploadImageFile(file)
        .then((cloudUrl: string) => {
          setEditImageUrls(prev => [...prev, cloudUrl]);
        })
        .catch((err: any) => console.error("[EDIT UPLOAD ERROR]", err))
        .finally(() => {
          done++;
          if (done === toAdd.length) setEditUploading(false);
        });
    });
    if (editFileRef.current) editFileRef.current.value = "";
  };

  const removeEditImage = (idx: number) => {
    setEditImageUrls(prev => prev.filter((_, i) => i !== idx));
  };

  if (!user || user.id !== post.userId) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(v => !v)}
          className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              className="absolute right-0 top-7 z-50 bg-background border border-border rounded-xl shadow-xl overflow-hidden min-w-[140px]"
            >
              <button
                onClick={() => { setEditing(true); setOpen(false); setEditContent(post.content); setEditImageUrls(parseImageUrls(post.imageUrl)); setEditUploading(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                onClick={() => { setConfirmDelete(true); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-500 transition-colors text-left"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm delete modal */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" /> Eliminar publicación
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2 space-y-4">
            <p className="text-sm text-muted-foreground">¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer y perderás 5 puntos.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => deletePost.mutate()} disabled={deletePost.isPending}>
                {deletePost.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar publicación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="min-h-[100px]"
              placeholder="Contenido de la publicación..."
            />
            {/* Image section */}
            {editImageUrls.length > 0 && (
              <div className={`grid gap-1 rounded-lg overflow-hidden border ${editImageUrls.length === 1 ? "grid-cols-1" : editImageUrls.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {editImageUrls.map((src, idx) => (
                  <div key={idx} className="relative group aspect-square bg-black">
                    <img src={src} alt={`edit-${idx}`} className="w-full h-full object-cover opacity-90" />
                    <button
                      type="button"
                      onClick={() => removeEditImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" type="button" size="sm" className="gap-2"
              onClick={() => editFileRef.current?.click()}
              disabled={editImageUrls.length >= 10 || editUploading}>
              {editUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {editUploading ? "Subiendo..." : editImageUrls.length > 0 ? `Añadir fotos (${editImageUrls.length}/10)` : "Agregar fotos"}
            </Button>
            <input ref={editFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleEditFileChange} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button onClick={() => editPost.mutate()} disabled={editPost.isPending}>
                {editPost.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Comment Menu (Edit/Delete) ───────────────────────────────────────────────
function CommentMenu({ comment, postId }: { comment: any; postId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentsUrl = buildUrl(api.posts.comments.list.path, { id: postId });

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const deleteComment = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${postId}/comments/${comment.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [commentsUrl] });
      toast({ title: "Comentario eliminado" });
      setConfirmDelete(false);
    },
    onError: () => toast({ variant: "destructive", title: "Error al eliminar" }),
  });

  const editComment = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/posts/${postId}/comments/${comment.id}`, { content: editContent });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [commentsUrl] });
      setEditing(false);
      setOpen(false);
      toast({ title: "Comentario editado" });
    },
    onError: () => toast({ variant: "destructive", title: "Error al editar" }),
  });

  if (!user || user.id !== comment.userId) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(v => !v)}
          className="p-0.5 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              className="absolute right-0 top-6 z-50 bg-background border border-border rounded-xl shadow-xl overflow-hidden min-w-[130px]"
            >
              <button
                onClick={() => { setEditing(true); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
              >
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button
                onClick={() => { setConfirmDelete(true); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 text-red-500 transition-colors text-left"
              >
                <Trash2 className="h-3.5 w-3.5" /> Eliminar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm delete modal */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" /> Eliminar comentario
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2 space-y-4">
            <p className="text-sm text-muted-foreground">¿Seguro que quieres eliminar este comentario? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={() => deleteComment.mutate()} disabled={deleteComment.isPending}>
                {deleteComment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Eliminar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar comentario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
              <Button onClick={() => editComment.mutate()} disabled={editComment.isPending}>
                {editComment.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Reactions (Facebook-style) ───────────────────────────────────────────────
function PostReactions({ postId }: { postId: number }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [reactionPopupPos, setReactionPopupPos] = useState({ bottom: 0, left: 0 });
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reactionsUrl = buildUrl(api.posts.reactions.get.path, { id: postId });

  const { data } = useQuery<{ counts: Record<string, number>; userReaction: string | null }>({
    queryKey: [reactionsUrl],
    queryFn: async () => {
      const res = await fetch(reactionsUrl, { credentials: "include" });
      if (!res.ok) return { counts: {}, userReaction: null };
      return res.json();
    },
  });

  const setReaction = useMutation({
    mutationFn: async (type: string) => {
      await apiRequest(
        api.posts.reactions.set.method,
        buildUrl(api.posts.reactions.set.path, { id: postId }),
        { type }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reactionsUrl] });
    },
  });

  const removeReaction = useMutation({
    mutationFn: async () => {
      await apiRequest(
        api.posts.reactions.remove.method,
        buildUrl(api.posts.reactions.remove.path, { id: postId })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reactionsUrl] });
    },
  });

  const userReaction = data?.userReaction ?? null;
  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : 0;
  const currentReaction = reactions.find((r) => r.id === userReaction);

  const handleMouseEnterBtn = () => {
    if (!user) return;
    leaveTimeout.current && clearTimeout(leaveTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      if (reactionBtnRef.current) {
        const rect = reactionBtnRef.current.getBoundingClientRect();
        const popupWidth = 340;
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - popupWidth - 8));
        const bottom = window.innerHeight - rect.top + 8;
        setReactionPopupPos({ bottom, left });
      }
      setOpen(true);
    }, 400);
  };

  const handleMouseLeaveBtn = () => {
    hoverTimeout.current && clearTimeout(hoverTimeout.current);
    leaveTimeout.current = setTimeout(() => {
      setOpen(false);
      setHoveredReaction(null);
    }, 300);
  };

  const handleMouseEnterPopup = () => {
    leaveTimeout.current && clearTimeout(leaveTimeout.current);
  };

  const handleMouseLeavePopup = () => {
    leaveTimeout.current = setTimeout(() => {
      setOpen(false);
      setHoveredReaction(null);
    }, 300);
  };

  const handleClickBtn = () => {
    if (!user) return;
    hoverTimeout.current && clearTimeout(hoverTimeout.current);
    if (!open) {
      if (userReaction) removeReaction.mutate();
      else {
        setReaction.mutate("like");
      }
    }
  };

  const handleSelectReaction = (reactionId: string) => {
    setOpen(false);
    setHoveredReaction(null);
    setReaction.mutate(reactionId);
  };

  useEffect(() => () => {
    hoverTimeout.current && clearTimeout(hoverTimeout.current);
    leaveTimeout.current && clearTimeout(leaveTimeout.current);
  }, []);

  return (
    <div className="flex items-center gap-3">
      {/* Reaction button */}
      <div className="relative">
        <motion.button
          ref={reactionBtnRef}
          onMouseEnter={handleMouseEnterBtn}
          onMouseLeave={handleMouseLeaveBtn}
          onClick={handleClickBtn}
          whileTap={{ scale: 0.9 }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors select-none
            ${userReaction
              ? "text-primary bg-primary/10 hover:bg-primary/20"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          style={userReaction && currentReaction ? { color: currentReaction.color } : {}}
        >
          <motion.span
            key={userReaction ?? "default"}
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="leading-none flex items-center"
          >
            {currentReaction
              ? (() => { const Icon = ReactionIcons[currentReaction.id]; return <Icon size={18} color={currentReaction.color} />; })()
              : <ReactionIcons.like size={18} color="currentColor" />
            }
          </motion.span>
          <span className="leading-none">
            {currentReaction ? currentReaction.label : "Reaccionar"}
          </span>
        </motion.button>

        {/* Reactions popup - portal with AnimatePresence INSIDE */}
        {createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, scale: 0.75, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75, y: 8 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                onMouseEnter={handleMouseEnterPopup}
                onMouseLeave={handleMouseLeavePopup}
                style={{
                  position: "fixed",
                  bottom: reactionPopupPos.bottom,
                  left: reactionPopupPos.left,
                  zIndex: 99999,
                  minWidth: "max-content",
                }}
                className="flex items-center gap-1 px-3 py-2 bg-background border border-border rounded-full shadow-2xl"
              >
                {reactions.map((r, i) => (
                  <motion.button
                    key={r.id}
                    initial={{ scale: 0, y: 10 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ delay: i * 0.04, type: "spring", stiffness: 500, damping: 22 }}
                    onHoverStart={() => setHoveredReaction(r.id)}
                    onHoverEnd={() => setHoveredReaction(null)}
                    onClick={() => handleSelectReaction(r.id)}
                    className={`relative flex flex-col items-center cursor-pointer rxn-hover-${r.id}`}
                  >
                    <motion.span
                      animate={hoveredReaction === r.id ? { scale: 1.5, y: -8 } : { scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      className="leading-none block flex items-center justify-center"
                      style={{ display: "flex" }}
                    >
                      {(() => { const Icon = ReactionIcons[r.id]; return <Icon size={26} color={r.color} />; })()}
                    </motion.span>
                    <AnimatePresence>
                      {hoveredReaction === r.id && (
                        <motion.span
                          initial={{ opacity: 0, y: 4, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded-full bg-foreground text-background shadow-md pointer-events-none"
                        >
                          {r.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* Reaction counts summary */}
      {total > 0 && (
        <div className="flex items-center gap-1">
          {Object.entries(data?.counts || {})
            .filter(([, c]) => c > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([type]) => {
              const r = reactions.find((r) => r.id === type);
              if (!r) return null;
              const Icon = ReactionIcons[r.id];
              return (
                <span key={type} className="leading-none flex items-center">
                  <Icon size={14} color={r.color} />
                </span>
              );
            })}
          <span className="text-xs text-muted-foreground ml-1">{total}</span>
        </div>
      )}
    </div>
  );
}

// ─── Share ────────────────────────────────────────────────────────────────────
const shareOptions = [
  {
    id: "facebook",
    label: "Facebook",
    icon: Facebook,
    color: "#1877F2",
    bg: "#E7F0FD",
  },
  {
    id: "twitter",
    label: "X / Twitter",
    icon: Twitter,
    color: "#000000",
    bg: "#E7E7E7",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    iconEmoji: "💬",
    color: "#25D366",
    bg: "#E7FBF0",
  },
  {
    id: "telegram",
    label: "Telegram",
    iconEmoji: "✈️",
    color: "#229ED9",
    bg: "#E3F4FC",
  },
  {
    id: "copy",
    label: "Copiar enlace",
    icon: Link2,
    color: "#6B7280",
    bg: "#F3F4F6",
  },
];

function PostShare({ postId }: { postId: number }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ bottom: 0, right: 0 });
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!btnRef.current?.contains(target) && !(document.getElementById(`share-portal-${postId}`)?.contains(target))) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        bottom: window.innerHeight - rect.top + 8,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    setOpen(v => !v);
  };

  const handleShare = (optionId: string) => {
    if (optionId === "copy") {
      const fakeUrl = `${window.location.origin}/comunidad/post/${postId}`;
      navigator.clipboard.writeText(fakeUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "¡Enlace copiado!", description: "El enlace fue copiado al portapapeles." });
      });
    }
    setOpen(false);
  };

  const portal = open ? createPortal(
    <AnimatePresence>
      <motion.div
        id={`share-portal-${postId}`}
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 8 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="fixed z-[9999] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
        style={{ bottom: pos.bottom, right: pos.right, minWidth: 220 }}
      >
        <div className="px-4 pt-3 pb-2 border-b border-border/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compartir publicación</p>
        </div>
        <div className="p-2 space-y-0.5">
          {shareOptions.map((opt, i) => (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleShare(opt.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-left group"
            >
              <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-base"
                style={{ backgroundColor: opt.bg, color: opt.color }}>
                {opt.iconEmoji ? <span className="text-sm">{opt.iconEmoji}</span> : opt.icon ? <opt.icon className="h-4 w-4" /> : null}
              </div>
              <span className="text-sm font-medium text-foreground">{opt.label}</span>
              {opt.id === "copy" && copied && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
                  <Check className="h-4 w-4 text-green-500" />
                </motion.span>
              )}
              {opt.id !== "copy" && (
                <span className="ml-auto text-[10px] text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">Próximamente</span>
              )}
            </motion.button>
          ))}
        </div>
        <div className="px-4 pb-3 pt-1">
          <p className="text-[10px] text-muted-foreground/60 text-center">Los links estarán disponibles pronto</p>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  ) : null;

  return (
    <>
      <motion.button
        ref={btnRef}
        whileTap={{ scale: 0.9 }}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
          ${open ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
      >
        <Share2 className="h-4 w-4" />
        <span>Compartir</span>
      </motion.button>
      {portal}
    </>
  );
}

// ─── PostFooter (Facebook-style: reactions summary + action buttons + comments) ──
function PostFooter({ post }: { post: any }) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Reaction counts row */}
      <PostReactionCounts postId={post.id} onCommentsClick={() => setCommentsOpen(v => !v)} />

      {/* Action buttons row - Like | Comment | Share */}
      <div className="flex items-center border-t border-border/40 py-1 overflow-visible">
        <PostReactions postId={post.id} />
        <button
          onClick={() => setCommentsOpen(v => !v)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden xs:inline sm:inline">Comentar</span>
        </button>
        <PostShare postId={post.id} />
      </div>

      {/* Comments section - below action buttons like Facebook */}
      <PostComments postId={post.id} open={commentsOpen} setOpen={setCommentsOpen} />
    </div>
  );
}

// ─── Reaction counts summary row ─────────────────────────────────────────────
function PostReactionCounts({ postId, onCommentsClick }: { postId: number; onCommentsClick: () => void }) {
  const reactionsUrl = buildUrl(api.posts.reactions.get.path, { id: postId });
  const commentsUrl = buildUrl(api.posts.comments.list.path, { id: postId });

  const { data: reactData } = useQuery<{ counts: Record<string, number>; userReaction: string | null }>({
    queryKey: [reactionsUrl],
    queryFn: async () => {
      const res = await fetch(reactionsUrl, { credentials: "include" });
      if (!res.ok) return { counts: {}, userReaction: null };
      return res.json();
    },
  });

  const { data: commentsData } = useQuery<any[]>({
    queryKey: [commentsUrl],
    queryFn: async () => {
      const res = await fetch(commentsUrl, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const total = reactData ? Object.values(reactData.counts).reduce((a, b) => a + b, 0) : 0;
  const commentCount = commentsData?.length ?? 0;

  if (total === 0 && commentCount === 0) return null;

  return (
    <div className="flex items-center justify-between px-1 py-1.5 text-xs text-muted-foreground">
      {total > 0 ? (
        <div className="flex items-center gap-1">
          {Object.entries(reactData?.counts || {})
            .filter(([, c]) => c > 0)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([type]) => {
              const r = reactions.find((r) => r.id === type);
              if (!r) return null;
              const Icon = ReactionIcons[r.id];
              return (
                <span key={type} className="leading-none flex items-center">
                  <Icon size={14} color={r.color} />
                </span>
              );
            })}
          <span className="ml-1">{total}</span>
        </div>
      ) : <div />}
      {commentCount > 0 && (
        <button onClick={onCommentsClick} className="hover:underline">
          {commentCount} comentario{commentCount !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

// ─── Comments ─────────────────────────────────────────────────────────────────
type CommentSort = "new" | "old" | "relevant";

function PostComments({ postId, open, setOpen }: { postId: number; open: boolean; setOpen: (v: boolean) => void }) {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [commentSort, setCommentSort] = useState<CommentSort>("new");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [commentImageBase64, setCommentImageBase64] = useState<string | null>(null);
  const [showGifSearch, setShowGifSearch] = useState(false);
  const [gifQuery, setGifQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifSearched, setGifSearched] = useState(false);
  const [activeGifCategory, setActiveGifCategory] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const gifBtnRef = useRef<HTMLButtonElement>(null);
  const [emojiPos, setEmojiPos] = useState({ bottom: 0, left: 0 });
  const [gifPos, setGifPos] = useState({ bottom: 0, left: 0 });

  const commentsUrl = buildUrl(api.posts.comments.list.path, { id: postId });

  const { data, isLoading } = useQuery<any[]>({
    queryKey: [commentsUrl],
    queryFn: async () => {
      const res = await fetch(commentsUrl, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  const addComment = useMutation({
    mutationFn: async ({ content, imageBase64 }: { content: string; imageBase64?: string | null }) => {
      await apiRequest(
        api.posts.comments.create.method,
        buildUrl(api.posts.comments.create.path, { id: postId }),
        { content, imageBase64: imageBase64 || undefined }
      );
    },
    onSuccess: () => {
      setValue("");
      setCommentImage(null);
      setCommentImageBase64(null);
      queryClient.invalidateQueries({ queryKey: [commentsUrl] });
    },
  });

  // Close emoji/gif on outside click
  useEffect(() => {
    if (!showEmojiPicker && !showGifSearch) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const emojiPortal = document.querySelector("[data-emoji-portal]");
      const gifPortal = document.querySelector("[data-gif-portal]");
      if (emojiBtnRef.current?.contains(target) || gifBtnRef.current?.contains(target)) return;
      if (emojiPortal?.contains(target) || gifPortal?.contains(target)) return;
      setShowEmojiPicker(false);
      setShowGifSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker, showGifSearch]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setValue(prev => prev + emojiData.emoji);
    commentInputRef.current?.focus();
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCommentImage(result);
      setCommentImageBase64(result.split(",")[1] || result);
    };
    reader.readAsDataURL(file);
  };

  // Auto-load trending when GIF panel opens
  useEffect(() => {
    if (showGifSearch && gifs.length === 0 && !gifSearched && !activeGifCategory) {
      loadGifCategory("trending");
    }
  }, [showGifSearch]);

  const searchGifs = async (q: string) => {
    if (!q.trim()) return;
    setGifLoading(true);
    setGifSearched(true);
    try {
      const res = await fetch(`${apiBase}/api/gifs/search?q=${encodeURIComponent(q.trim())}`, { credentials: "include" });
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch {
      setGifs([]);
    }
    setGifLoading(false);
  };

  const loadGifCategory = async (cat: string) => {
    setActiveGifCategory(cat);
    setGifSearched(false);
    setGifLoading(true);
    try {
      const endpoint = cat === "trending"
        ? `/api/gifs/trending`
        : `/api/gifs/category?cat=${encodeURIComponent(cat)}`;
      const res = await fetch(endpoint, { credentials: "include" });
      const data = await res.json();
      setGifs(data.gifs || []);
    } catch {
      setGifs([]);
    }
    setGifLoading(false);
  };

  const handleSelectGif = (gifUrl: string) => {
    setCommentImage(gifUrl);
    setCommentImageBase64(gifUrl);
    setShowGifSearch(false);
    setGifs([]);
    setGifQuery("");
    setGifSearched(false);
    setActiveGifCategory(null);
  };

  const sortedComments = React.useMemo(() => {
    if (!data) return [];
    const copy = [...data];
    if (commentSort === "new") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (commentSort === "old") return copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return copy;
  }, [data, commentSort]);

  const canSubmit = (value.trim().length > 0 || !!commentImage) && !!user && !addComment.isPending;

  if (!open) return null;

  return (
    <div className="w-full border-t border-border/40 pt-2 pb-3 space-y-3">
      {/* Sort tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Ordenar:</span>
        {(["relevant", "new", "old"] as CommentSort[]).map((s) => (
          <button
            key={s}
            onClick={() => setCommentSort(s)}
            className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
              commentSort === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            {s === "new" ? "Nuevos" : s === "old" ? "Antiguos" : "Relevantes"}
          </button>
        ))}
      </div>

      {/* Comments list FIRST (above input, like Facebook) */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : sortedComments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">
          Sin comentarios aún. ¡Sé el primero!
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {sortedComments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                {c.author?.name?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted rounded-2xl px-3 py-2 inline-block max-w-full group relative">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{c.author?.name}</span>
                    <CommentMenu comment={c} postId={postId} />
                  </div>
                  {c.editedAt && <span className="text-[10px] text-muted-foreground italic">(editado)</span>}
                  {c.content && <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{c.content}</p>}
                  {c.imageUrl && (
                    <div className="mt-1 relative rounded-xl overflow-hidden bg-black flex items-center justify-center" style={{ maxHeight: "240px", minHeight: "60px" }}>
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${c.imageUrl})`, filter: "blur(16px) brightness(0.45)", transform: "scale(1.15)" }}
                      />
                      <img src={c.imageUrl} alt="comment media" className="relative z-10 max-w-full object-contain" style={{ maxHeight: "240px", display: "block" }} />
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 ml-2">
                  {format(new Date(c.createdAt), "d MMM · HH:mm", { locale: es })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Comment input AT BOTTOM like Facebook */}
      <div className="flex items-start gap-2">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mt-1">
          {user ? user.name[0] : "?"}
        </div>
        <div className="flex-1 space-y-1">
          {/* Image/GIF preview */}
          {commentImage && (
            <div className="relative inline-block">
              <img src={commentImage} alt="preview" className="max-h-32 rounded-xl object-cover border" />
              <button
                onClick={() => { setCommentImage(null); setCommentImageBase64(null); }}
                className="absolute -top-1 -right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Emoji picker portal */}
          {showEmojiPicker && createPortal(
            <div
              ref={emojiRef}
              data-emoji-portal="" style={{
                position: "fixed",
                bottom: emojiPos.bottom,
                left: Math.min(emojiPos.left, window.innerWidth - 320),
                zIndex: 9999,
                maxWidth: "calc(100vw - 16px)",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 8 }}
              >
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme={"auto" as Theme}
                  width="min(300px, calc(100vw - 16px))"
                  height={350}
                  searchPlaceholder="Buscar emoji..."
                />
              </motion.div>
            </div>,
            document.body
          )}

          {/* GIF library portal */}
          {showGifSearch && createPortal(
            <div
              data-gif-portal=""
              style={{
                position: "fixed",
                bottom: gifPos.bottom,
                left: Math.max(8, Math.min(gifPos.left, window.innerWidth - Math.min(340, window.innerWidth - 16))),
                zIndex: 9999,
                width: Math.min(340, window.innerWidth - 16),
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                style={{ height: 400 }}
              >
                {/* Search bar */}
                <div className="p-2 border-b border-border/50 flex gap-2 items-center">
                  <input
                    value={gifQuery}
                    onChange={(e) => {
                      setGifQuery(e.target.value);
                      if (e.target.value === "") {
                        // back to category view
                        setGifSearched(false);
                        if (activeGifCategory) loadGifCategory(activeGifCategory);
                        else loadGifCategory("trending");
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value;
                        searchGifs(val);
                      }
                    }}
                    placeholder="🔍 Buscar GIF..."
                    className="flex-1 text-sm px-3 py-1.5 rounded-full border border-border bg-muted focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  {gifQuery ? (
                    <button
                      onClick={() => searchGifs(gifQuery)}
                      className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0"
                    >
                      Ir
                    </button>
                  ) : null}
                </div>

                {/* Categories tabs - only show when not searching */}
                {!gifSearched && (
                  <div className="flex gap-1 px-2 py-1.5 overflow-x-auto border-b border-border/30 flex-shrink-0" style={{ scrollbarWidth: "none" }}>
                    {[
                      { id: "trending", label: "🔥 Trending" },
                      { id: "feliz", label: "😄 Feliz" },
                      { id: "triste", label: "😢 Triste" },
                      { id: "gracias", label: "🙏 Gracias" },
                      { id: "aplausos", label: "👏 Aplausos" },
                      { id: "amor", label: "❤️ Amor" },
                      { id: "sorpresa", label: "😱 Sorpresa" },
                      { id: "baile", label: "💃 Baile" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => loadGifCategory(cat.id)}
                        className={`whitespace-nowrap text-xs px-2.5 py-1 rounded-full transition-colors flex-shrink-0 ${
                          activeGifCategory === cat.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Results */}
                <div className="overflow-y-auto flex-1 p-1.5">
                  {gifLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : gifSearched && gifs.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">Sin resultados para "{gifQuery}"</p>
                  ) : gifs.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1">
                      {gifs.map((gif) => (
                        <button
                          key={gif.id}
                          onClick={() => handleSelectGif(gif.url)}
                          className="rounded-xl overflow-hidden hover:opacity-80 active:scale-95 transition-all bg-muted"
                          style={{ aspectRatio: "1" }}
                        >
                          <img
                            src={gif.preview || gif.url}
                            alt={gif.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-center items-center py-8 text-xs text-muted-foreground">
                      Selecciona una categoría o busca
                    </div>
                  )}
                </div>

                {/* Giphy branding */}
                <div className="px-3 py-1.5 border-t border-border/30 flex justify-end">
                  <span className="text-[9px] text-muted-foreground/50 tracking-wider">Powered by GIPHY</span>
                </div>
              </motion.div>
            </div>,
            document.body
          )}

          {/* Input row */}
          <div ref={emojiRef} className="flex items-center bg-muted rounded-2xl px-3 py-2 gap-1 min-w-0">
              <textarea
                ref={commentInputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={user ? `Comentar como ${user.name}...` : "Inicia sesión para comentar"}
                disabled={!user}
                rows={1}
                className="flex-1 min-w-0 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground min-h-[20px] max-h-[80px] leading-5"
                style={{ overflow: "hidden" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 80) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && canSubmit) {
                    e.preventDefault();
                    addComment.mutate({ content: value.trim(), imageBase64: commentImageBase64 });
                  }
                }}
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  ref={emojiBtnRef}
                  type="button"
                  onClick={() => {
                    if (emojiBtnRef.current) {
                      const r = emojiBtnRef.current.getBoundingClientRect();
                      setEmojiPos({ bottom: window.innerHeight - r.top + 8, left: Math.max(8, Math.min(r.left, window.innerWidth - 310)) });
                    }
                    setShowEmojiPicker(v => !v);
                    setShowGifSearch(false);
                  }}
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                  title="Emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => imageRef.current?.click()}
                  className="text-muted-foreground hover:text-primary transition-colors p-1"
                  title="Imagen"
                >
                  <ImageIcon className="h-4 w-4" />
                </button>
                <button
                  ref={gifBtnRef}
                  type="button"
                  onClick={() => {
                    if (gifBtnRef.current) {
                      const r = gifBtnRef.current.getBoundingClientRect();
                      const panelW = Math.min(340, window.innerWidth - 16);
                      // Align right edge of panel to right edge of button, clamp to screen
                      const rightEdge = r.right;
                      const leftPos = Math.max(8, Math.min(rightEdge - panelW, window.innerWidth - panelW - 8));
                      setGifPos({
                        bottom: window.innerHeight - r.top + 8,
                        left: leftPos,
                      });
                    }
                    const opening = !showGifSearch;
                    setShowGifSearch(v => !v);
                    setShowEmojiPicker(false);
                    if (opening && !activeGifCategory) {
                      loadGifCategory("trending");
                    }
                  }}
                  className="text-muted-foreground hover:text-primary transition-colors p-1 text-xs font-bold"
                  title="GIF"
                >
                  GIF
                </button>
                {canSubmit && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => addComment.mutate({ content: value.trim(), imageBase64: commentImageBase64 })}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                  >
                    {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        </div>
      </div>
    
  );
}