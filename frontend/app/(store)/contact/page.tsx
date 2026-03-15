"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { submitContactAPI } from "@/services/contact-service";
import logger from "@/lib/logger";

export default function ContactPage() {
  const { t } = useTranslation("common");
  const { toast } = useToast();
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: t("contact.allFieldsRequired"), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await submitContactAPI(form);
      setSubmitted(true);
      toast({ title: t("contact.success") });
    } catch (err: unknown) {
      logger.error("submitContact error:", err);
      const errorMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || t("contact.errorSubmitting");
      toast({ title: errorMsg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("contact.title")}</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Contact info */}
        <div className="space-y-6">
          {settings?.store?.contactEmail && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{t("contact.email")}</p>
                <p className="text-sm text-muted-foreground">{settings.store.contactEmail}</p>
              </div>
            </div>
          )}
          {settings?.store?.contactPhone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{t("contact.phone")}</p>
                <p className="text-sm text-muted-foreground">{settings.store.contactPhone}</p>
              </div>
            </div>
          )}
          {settings?.store?.address && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{t("contact.address")}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{settings.store.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Contact form */}
        <div className="md:col-span-2">
          {submitted ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-2">{t("contact.thankYou")}</h2>
              <p className="text-muted-foreground">{t("contact.thankYouMessage")}</p>
              <Button className="mt-4" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                {t("contact.sendAnother")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-name">{t("contact.nameLabel")}</Label>
                  <Input id="contact-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="contact-email">{t("contact.emailLabel")}</Label>
                  <Input id="contact-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div>
                <Label htmlFor="contact-subject">{t("contact.subjectLabel")}</Label>
                <Input id="contact-subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="contact-message">{t("contact.messageLabel")}</Label>
                <Textarea id="contact-message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? t("contact.sending") : t("contact.send")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
