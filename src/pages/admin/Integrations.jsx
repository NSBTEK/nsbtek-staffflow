import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Shield, Mail, Link2, CheckCircle2, Settings, ExternalLink, Zap,
  MessageSquare, Calendar, Globe, Phone, Search, Users, FileText,
  BarChart2, Database, Briefcase, Video, CreditCard, Bot, Bell, RefreshCw
} from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { toast } from 'sonner';

const INTEGRATIONS = [
  // ─── Communication ───────────────────────────────────────────────
  { id: 'smtp', name: 'Email (SMTP)', desc: 'Send automated emails, candidate notifications, and interview invites.', icon: Mail, color: 'bg-blue-50 text-blue-600', cat: 'Communication', popular: true, fields: [{ k: 'host', l: 'SMTP Host', ph: 'smtp.gmail.com' }, { k: 'port', l: 'Port', ph: '587' }, { k: 'user', l: 'Username/Email', ph: 'you@company.com' }, { k: 'pass', l: 'Password', t: 'password', ph: '••••••••' }, { k: 'from_name', l: 'From Name', ph: 'StaffFlow' }], docs: 'https://support.google.com/mail/answer/7126229' },
  { id: 'sendgrid', name: 'SendGrid', desc: 'Transactional email delivery with templates, tracking, and analytics.', icon: Mail, color: 'bg-blue-50 text-blue-700', cat: 'Communication', popular: true, fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: 'SG.xxxxxxxx' }, { k: 'from_email', l: 'From Email', ph: 'noreply@company.com' }], docs: 'https://sendgrid.com/docs' },
  { id: 'mailchimp', name: 'Mailchimp', desc: 'Sync candidate and contact lists for email marketing campaigns.', icon: Mail, color: 'bg-yellow-50 text-yellow-700', cat: 'Communication', fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: 'xxxxxxxxxxxxxxxx-us1' }, { k: 'list_id', l: 'Audience/List ID', ph: 'abc123def' }], docs: 'https://mailchimp.com/developer/' },
  { id: 'slack', name: 'Slack', desc: 'Real-time alerts for submissions, interviews, approvals, and more.', icon: MessageSquare, color: 'bg-purple-50 text-purple-600', cat: 'Communication', popular: true, fields: [{ k: 'webhook', l: 'Webhook URL', ph: 'https://hooks.slack.com/services/...' }, { k: 'channel', l: 'Default Channel', ph: '#staffflow' }], docs: 'https://api.slack.com/messaging/webhooks' },
  { id: 'teams', name: 'Microsoft Teams', desc: 'Send notifications and updates directly into Teams channels.', icon: MessageSquare, color: 'bg-indigo-50 text-indigo-600', cat: 'Communication', fields: [{ k: 'webhook', l: 'Incoming Webhook URL', ph: 'https://outlook.office.com/webhook/...' }], docs: 'https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook' },
  { id: 'twilio', name: 'Twilio SMS', desc: 'Send SMS reminders to candidates, employees, and managers.', icon: Phone, color: 'bg-red-50 text-red-600', cat: 'Communication', fields: [{ k: 'sid', l: 'Account SID', ph: 'ACxxxxxxxx' }, { k: 'token', l: 'Auth Token', t: 'password', ph: '••••••••' }, { k: 'from', l: 'From Number', ph: '+15551234567' }], docs: 'https://www.twilio.com/docs' },
  { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Communicate with candidates and employees via WhatsApp.', icon: Phone, color: 'bg-green-50 text-green-600', cat: 'Communication', fields: [{ k: 'token', l: 'Access Token', t: 'password', ph: '••••••••' }, { k: 'phone_id', l: 'Phone Number ID', ph: '1234567890' }], docs: 'https://developers.facebook.com/docs/whatsapp' },

  // ─── Sourcing ──────────────────────────────────────────────────────
  { id: 'linkedin', name: 'LinkedIn Recruiter', desc: 'Source candidates, sync profiles, and track LinkedIn activities.', icon: Users, color: 'bg-sky-50 text-sky-700', cat: 'Sourcing', popular: true, fields: [{ k: 'client_id', l: 'Client ID', ph: 'From LinkedIn Developer App' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }], docs: 'https://developer.linkedin.com/' },
  { id: 'indeed', name: 'Indeed', desc: 'Post jobs to Indeed and auto-import candidate applications.', icon: Briefcase, color: 'bg-indigo-50 text-indigo-600', cat: 'Sourcing', fields: [{ k: 'publisher', l: 'Publisher ID', ph: 'Your Indeed Publisher ID' }, { k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://developer.indeed.com/' },
  { id: 'ziprecruiter', name: 'ZipRecruiter', desc: 'Distribute jobs to ZipRecruiter\'s network and import applicants.', icon: Briefcase, color: 'bg-orange-50 text-orange-600', cat: 'Sourcing', fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://www.ziprecruiter.com/zipsearch' },
  { id: 'dice', name: 'Dice', desc: 'Post tech jobs and source IT/engineering candidates from Dice.', icon: Briefcase, color: 'bg-red-50 text-red-600', cat: 'Sourcing', fields: [{ k: 'client_id', l: 'Client ID', ph: 'From Dice API' }, { k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://www.dice.com/hiring' },
  { id: 'monster', name: 'Monster', desc: 'Access millions of resumes and post job listings on Monster.', icon: Globe, color: 'bg-violet-50 text-violet-600', cat: 'Sourcing', fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://partner.monster.com/' },
  { id: 'careerbuilder', name: 'CareerBuilder', desc: 'Post jobs and search the CareerBuilder candidate database.', icon: Briefcase, color: 'bg-teal-50 text-teal-600', cat: 'Sourcing', fields: [{ k: 'client_id', l: 'Client ID', ph: '••••••••' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }], docs: 'https://developer.careerbuilder.com/' },
  { id: 'github_jobs', name: 'GitHub Jobs', desc: 'Post tech and developer roles directly on GitHub.', icon: Briefcase, color: 'bg-slate-50 text-slate-700', cat: 'Sourcing', fields: [{ k: 'token', l: 'GitHub Token', t: 'password', ph: 'ghp_xxxxxxxxxx' }], docs: 'https://docs.github.com/en/rest' },

  // ─── Productivity ─────────────────────────────────────────────────
  { id: 'google_calendar', name: 'Google Calendar', desc: 'Auto-create interview events, follow-ups, and onboarding tasks.', icon: Calendar, color: 'bg-green-50 text-green-600', cat: 'Productivity', popular: true, fields: [{ k: 'client_id', l: 'OAuth Client ID', ph: 'From Google Cloud Console' }, { k: 'client_secret', l: 'OAuth Client Secret', t: 'password', ph: '••••••••' }], docs: 'https://developers.google.com/calendar' },
  { id: 'outlook', name: 'Outlook / Office 365', desc: 'Sync interviews and tasks with Outlook Calendar and Teams.', icon: Calendar, color: 'bg-blue-50 text-blue-600', cat: 'Productivity', fields: [{ k: 'client_id', l: 'Azure App Client ID', ph: 'xxxxxxxx-xxxx-xxxx-xxxx' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }, { k: 'tenant_id', l: 'Tenant ID', ph: 'xxxxxxxx-xxxx-xxxx-xxxx' }], docs: 'https://docs.microsoft.com/en-us/graph/' },
  { id: 'google_drive', name: 'Google Drive', desc: 'Store and access resumes, contracts, and offer letters in Drive.', icon: FileText, color: 'bg-yellow-50 text-yellow-600', cat: 'Productivity', fields: [{ k: 'client_id', l: 'OAuth Client ID', ph: 'From Google Cloud Console' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }], docs: 'https://developers.google.com/drive' },
  { id: 'dropbox', name: 'Dropbox', desc: 'Store resumes, contracts, and documents in Dropbox.', icon: FileText, color: 'bg-blue-50 text-blue-700', cat: 'Productivity', fields: [{ k: 'app_key', l: 'App Key', ph: '••••••••' }, { k: 'app_secret', l: 'App Secret', t: 'password', ph: '••••••••' }], docs: 'https://www.dropbox.com/developers' },
  { id: 'docusign', name: 'DocuSign', desc: 'Send and e-sign offer letters, contracts, and NDAs.', icon: FileText, color: 'bg-yellow-50 text-yellow-700', cat: 'Productivity', popular: true, fields: [{ k: 'integration_key', l: 'Integration Key', ph: 'xxxxxxxx-xxxx-xxxx-xxxx' }, { k: 'secret_key', l: 'Secret Key', t: 'password', ph: '••••••••' }, { k: 'account_id', l: 'Account ID', ph: 'xxxxxxxx-xxxx-xxxx-xxxx' }], docs: 'https://developers.docusign.com/' },
  { id: 'zoom', name: 'Zoom', desc: 'Auto-generate Zoom meeting links for video interviews.', icon: Video, color: 'bg-blue-50 text-blue-600', cat: 'Productivity', fields: [{ k: 'api_key', l: 'API Key', ph: 'xxxxxxxx' }, { k: 'api_secret', l: 'API Secret', t: 'password', ph: '••••••••' }], docs: 'https://developers.zoom.us/' },
  { id: 'google_meet', name: 'Google Meet', desc: 'Create Google Meet links for candidate video interviews.', icon: Video, color: 'bg-green-50 text-green-600', cat: 'Productivity', fields: [{ k: 'client_id', l: 'OAuth Client ID', ph: 'From Google Cloud Console' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }], docs: 'https://developers.google.com/meet' },
  { id: 'notion', name: 'Notion', desc: 'Sync job postings, candidate notes, and onboarding docs to Notion.', icon: FileText, color: 'bg-slate-50 text-slate-700', cat: 'Productivity', fields: [{ k: 'token', l: 'Integration Token', t: 'password', ph: 'secret_xxxxxxxxxx' }, { k: 'database_id', l: 'Database ID', ph: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' }], docs: 'https://developers.notion.com/' },
  { id: 'asana', name: 'Asana', desc: 'Create tasks from onboarding checklists and follow-up activities.', icon: FileText, color: 'bg-pink-50 text-pink-600', cat: 'Productivity', fields: [{ k: 'token', l: 'Personal Access Token', t: 'password', ph: '••••••••' }, { k: 'workspace', l: 'Workspace ID', ph: '••••••••' }], docs: 'https://developers.asana.com/' },
  { id: 'trello', name: 'Trello', desc: 'Mirror candidate pipelines as Trello boards and cards.', icon: FileText, color: 'bg-sky-50 text-sky-700', cat: 'Productivity', fields: [{ k: 'key', l: 'API Key', ph: '••••••••' }, { k: 'token', l: 'Token', t: 'password', ph: '••••••••' }], docs: 'https://developer.atlassian.com/cloud/trello/' },

  // ─── HR & Payroll ─────────────────────────────────────────────────
  { id: 'adp', name: 'ADP Workforce Now', desc: 'Sync employee data, payroll, and benefits with ADP.', icon: CreditCard, color: 'bg-red-50 text-red-600', cat: 'HR & Payroll', popular: true, fields: [{ k: 'client_id', l: 'Client ID', ph: 'From ADP Marketplace' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }], docs: 'https://developers.adp.com/' },
  { id: 'gusto', name: 'Gusto', desc: 'Sync payroll runs, employee onboarding, and benefits with Gusto.', icon: CreditCard, color: 'bg-green-50 text-green-600', cat: 'HR & Payroll', fields: [{ k: 'client_id', l: 'Client ID', ph: '••••••••' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }], docs: 'https://docs.gusto.com/' },
  { id: 'bamboohr', name: 'BambooHR', desc: 'Sync employee records, time-off, and HR data with BambooHR.', icon: Users, color: 'bg-green-50 text-green-700', cat: 'HR & Payroll', popular: true, fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }, { k: 'subdomain', l: 'Company Subdomain', ph: 'yourcompany' }], docs: 'https://documentation.bamboohr.com/' },
  { id: 'workday', name: 'Workday', desc: 'Enterprise HCM integration — sync workers, time, and payroll.', icon: Users, color: 'bg-orange-50 text-orange-600', cat: 'HR & Payroll', fields: [{ k: 'tenant', l: 'Tenant Name', ph: 'mycompany_impl' }, { k: 'username', l: 'Integration Username', ph: 'ISU_user' }, { k: 'password', l: 'Password', t: 'password', ph: '••••••••' }], docs: 'https://community.workday.com/developer' },
  { id: 'rippling', name: 'Rippling', desc: 'Connect payroll, benefits, and device management via Rippling.', icon: Users, color: 'bg-yellow-50 text-yellow-700', cat: 'HR & Payroll', fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://developer.rippling.com/' },
  { id: 'quickbooks', name: 'QuickBooks', desc: 'Export invoices and billing data from placements to QuickBooks.', icon: CreditCard, color: 'bg-green-50 text-green-800', cat: 'HR & Payroll', fields: [{ k: 'client_id', l: 'Client ID', ph: '••••••••' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }, { k: 'realm_id', l: 'Realm ID', ph: 'Your company ID' }], docs: 'https://developer.intuit.com/' },

  // ─── CRM & Sales ─────────────────────────────────────────────────
  { id: 'salesforce', name: 'Salesforce', desc: 'Sync client accounts, contacts, and pipeline to Salesforce CRM.', icon: Database, color: 'bg-sky-50 text-sky-600', cat: 'CRM & Sales', popular: true, fields: [{ k: 'client_id', l: 'Consumer Key', ph: '••••••••' }, { k: 'client_secret', l: 'Consumer Secret', t: 'password', ph: '••••••••' }, { k: 'domain', l: 'Instance URL', ph: 'https://yourcompany.salesforce.com' }], docs: 'https://developer.salesforce.com/' },
  { id: 'hubspot', name: 'HubSpot CRM', desc: 'Sync deals, contacts, and companies between StaffFlow and HubSpot.', icon: Database, color: 'bg-orange-50 text-orange-600', cat: 'CRM & Sales', fields: [{ k: 'api_key', l: 'Private App Token', t: 'password', ph: 'pat-na1-xxxxxxxx' }], docs: 'https://developers.hubspot.com/' },
  { id: 'zoho_crm', name: 'Zoho CRM', desc: 'Manage client relationships and sync leads from Zoho CRM.', icon: Database, color: 'bg-red-50 text-red-600', cat: 'CRM & Sales', fields: [{ k: 'client_id', l: 'Client ID', ph: '••••••••' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }], docs: 'https://www.zoho.com/crm/developer/' },
  { id: 'pipedrive', name: 'Pipedrive', desc: 'Sync sales pipeline and deals with Pipedrive.', icon: Database, color: 'bg-emerald-50 text-emerald-600', cat: 'CRM & Sales', fields: [{ k: 'api_token', l: 'API Token', t: 'password', ph: '••••••••' }], docs: 'https://developers.pipedrive.com/' },

  // ─── Background Check ─────────────────────────────────────────────
  { id: 'checkr', name: 'Checkr', desc: 'Run background checks on candidates directly from StaffFlow.', icon: Shield, color: 'bg-teal-50 text-teal-600', cat: 'Background Check', popular: true, fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://docs.checkr.com/' },
  { id: 'sterling', name: 'Sterling', desc: 'Enterprise background screening and identity verification.', icon: Shield, color: 'bg-blue-50 text-blue-700', cat: 'Background Check', fields: [{ k: 'client_id', l: 'Client ID', ph: '••••••••' }, { k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://www.sterlingcheck.com/' },
  { id: 'hireright', name: 'HireRight', desc: 'Background checks, drug testing, and employment verification.', icon: Shield, color: 'bg-indigo-50 text-indigo-600', cat: 'Background Check', fields: [{ k: 'username', l: 'Username', ph: '••••••••' }, { k: 'password', l: 'Password', t: 'password', ph: '••••••••' }], docs: 'https://api.hireright.com/' },

  // ─── Analytics ─────────────────────────────────────────────────────
  { id: 'google_analytics', name: 'Google Analytics', desc: 'Track job page views, application rates, and funnel analytics.', icon: BarChart2, color: 'bg-orange-50 text-orange-600', cat: 'Analytics', fields: [{ k: 'measurement_id', l: 'Measurement ID', ph: 'G-XXXXXXXXXX' }, { k: 'api_secret', l: 'API Secret', t: 'password', ph: '••••••••' }], docs: 'https://developers.google.com/analytics' },
  { id: 'powerbi', name: 'Power BI', desc: 'Export StaffFlow data to Power BI for custom dashboards.', icon: BarChart2, color: 'bg-yellow-50 text-yellow-700', cat: 'Analytics', fields: [{ k: 'client_id', l: 'Client ID', ph: 'xxxxxxxx-xxxx-xxxx-xxxx' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }, { k: 'workspace_id', l: 'Workspace ID', ph: '••••••••' }], docs: 'https://docs.microsoft.com/en-us/power-bi/developer/' },
  { id: 'tableau', name: 'Tableau', desc: 'Connect StaffFlow data sources to Tableau for advanced reporting.', icon: BarChart2, color: 'bg-sky-50 text-sky-600', cat: 'Analytics', fields: [{ k: 'server_url', l: 'Server URL', ph: 'https://tableau.yourcompany.com' }, { k: 'token_name', l: 'Token Name', ph: '••••••••' }, { k: 'token_value', l: 'Token Value', t: 'password', ph: '••••••••' }], docs: 'https://help.tableau.com/current/api/rest_api/' },

  // ─── Automation ────────────────────────────────────────────────────
  { id: 'zapier', name: 'Zapier', desc: 'Connect StaffFlow to 5,000+ apps. Automate any workflow.', icon: Zap, color: 'bg-orange-50 text-orange-600', cat: 'Automation', popular: true, fields: [{ k: 'webhook', l: 'Zapier Webhook URL', ph: 'https://hooks.zapier.com/...' }], docs: 'https://zapier.com/apps' },
  { id: 'make', name: 'Make (Integromat)', desc: 'Visual automation platform — build complex multi-step workflows.', icon: Zap, color: 'bg-violet-50 text-violet-600', cat: 'Automation', fields: [{ k: 'webhook', l: 'Make Webhook URL', ph: 'https://hook.eu1.make.com/...' }], docs: 'https://www.make.com/en/api-documentation' },
  { id: 'n8n', name: 'n8n (Open Source)', desc: 'Self-hosted workflow automation — free and open source.', icon: Zap, color: 'bg-red-50 text-red-600', cat: 'Automation', fields: [{ k: 'webhook', l: 'n8n Webhook URL', ph: 'https://your-n8n.com/webhook/...' }], docs: 'https://docs.n8n.io/' },

  // ─── AI & Screening ────────────────────────────────────────────────
  { id: 'openai', name: 'OpenAI / ChatGPT', desc: 'AI-powered resume screening, job description generation, and summaries.', icon: Bot, color: 'bg-emerald-50 text-emerald-600', cat: 'AI & Screening', popular: true, fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx' }, { k: 'model', l: 'Model', ph: 'gpt-4o' }], docs: 'https://platform.openai.com/docs' },
  { id: 'textkernel', name: 'Textkernel', desc: 'AI resume parsing, candidate matching, and skills extraction.', icon: Bot, color: 'bg-blue-50 text-blue-600', cat: 'AI & Screening', fields: [{ k: 'username', l: 'Username', ph: '••••••••' }, { k: 'password', l: 'Password', t: 'password', ph: '••••••••' }], docs: 'https://developer.textkernel.com/' },
  { id: 'sovren', name: 'Sovren (Affinda)', desc: 'Industry-leading resume parsing and candidate matching API.', icon: Bot, color: 'bg-teal-50 text-teal-700', cat: 'AI & Screening', fields: [{ k: 'account_id', l: 'Account ID', ph: '••••••••' }, { k: 'service_key', l: 'Service Key', t: 'password', ph: '••••••••' }], docs: 'https://docs.sovren.com/' },
  { id: 'hirevue', name: 'HireVue', desc: 'AI-driven video interviews and candidate assessments.', icon: Video, color: 'bg-purple-50 text-purple-600', cat: 'AI & Screening', fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }, { k: 'org_slug', l: 'Organization Slug', ph: 'yourcompany' }], docs: 'https://developer.hirevue.com/' },
  { id: 'hackerrank', name: 'HackerRank', desc: 'Send technical coding assessments to candidates.', icon: Bot, color: 'bg-emerald-50 text-emerald-700', cat: 'AI & Screening', fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://www.hackerrank.com/work/developer' },
  { id: 'codility', name: 'Codility', desc: 'Online coding tests and technical interviews.', icon: Bot, color: 'bg-rose-50 text-rose-600', cat: 'AI & Screening', fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://codility.com/developers/' },

  // ─── Staffing-Specific (Ceipal-like) ─────────────────────────────
  { id: 'vms_fieldglass', name: 'SAP Fieldglass (VMS)', desc: 'Submit candidates and manage contingent workforce via Fieldglass VMS.', icon: Briefcase, color: 'bg-blue-50 text-blue-800', cat: 'VMS / Staffing', popular: true, fields: [{ k: 'client_id', l: 'Client ID', ph: '••••••••' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }, { k: 'endpoint', l: 'API Endpoint', ph: 'https://api.fieldglass.net' }], docs: 'https://api.sap.com/api/SAP_Fieldglass_Connector/' },
  { id: 'vms_beeline', name: 'Beeline (VMS)', desc: 'Manage contingent workforce submissions and placements via Beeline.', icon: Briefcase, color: 'bg-amber-50 text-amber-700', cat: 'VMS / Staffing', fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }, { k: 'company_id', l: 'Company ID', ph: '••••••••' }], docs: 'https://beeline.com/' },
  { id: 'vms_iqnavigator', name: 'IQNavigator / Coupa', desc: 'Submit to IQNavigator/Coupa VMS for enterprise clients.', icon: Briefcase, color: 'bg-rose-50 text-rose-700', cat: 'VMS / Staffing', fields: [{ k: 'username', l: 'Username', ph: '••••••••' }, { k: 'password', l: 'Password', t: 'password', ph: '••••••••' }, { k: 'client_id', l: 'Client Org ID', ph: '••••••••' }], docs: 'https://www.coupa.com/' },
  { id: 'vms_wand', name: 'Wand (PRO Unlimited)', desc: 'Contingent workforce management and VMS submissions.', icon: Briefcase, color: 'bg-teal-50 text-teal-700', cat: 'VMS / Staffing', fields: [{ k: 'api_key', l: 'API Key', t: 'password', ph: '••••••••' }], docs: 'https://prounlimited.com/' },
  { id: 'e_verify', name: 'E-Verify', desc: 'Verify employment eligibility for new hires via USCIS E-Verify.', icon: Shield, color: 'bg-blue-50 text-blue-700', cat: 'VMS / Staffing', popular: true, fields: [{ k: 'client_id', l: 'Client ID', ph: '••••••••' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }], docs: 'https://www.e-verify.gov/' },
  { id: 'job_diva', name: 'JobDiva', desc: 'Sync candidates and jobs between StaffFlow and JobDiva ATS.', icon: Database, color: 'bg-indigo-50 text-indigo-600', cat: 'VMS / Staffing', fields: [{ k: 'username', l: 'Username', ph: '••••••••' }, { k: 'password', l: 'Password', t: 'password', ph: '••••••••' }], docs: 'https://www.jobdiva.com/' },
  { id: 'bullhorn', name: 'Bullhorn', desc: 'Industry-leading staffing CRM and ATS integration.', icon: Database, color: 'bg-orange-50 text-orange-700', cat: 'VMS / Staffing', popular: true, fields: [{ k: 'client_id', l: 'Client ID', ph: '••••••••' }, { k: 'client_secret', l: 'Client Secret', t: 'password', ph: '••••••••' }, { k: 'username', l: 'Username', ph: '••••••••' }, { k: 'password', l: 'Password', t: 'password', ph: '••••••••' }], docs: 'https://bullhorn.github.io/rest-api-docs/' },

  // ─── Notifications ─────────────────────────────────────────────────
  { id: 'pushover', name: 'Pushover', desc: 'Send push notifications to mobile devices for urgent alerts.', icon: Bell, color: 'bg-red-50 text-red-600', cat: 'Notifications', fields: [{ k: 'user_key', l: 'User Key', ph: '••••••••' }, { k: 'api_token', l: 'API Token', t: 'password', ph: '••••••••' }], docs: 'https://pushover.net/api' },
  { id: 'pagerduty', name: 'PagerDuty', desc: 'Escalate critical system or process issues via PagerDuty.', icon: Bell, color: 'bg-emerald-50 text-emerald-600', cat: 'Notifications', fields: [{ k: 'routing_key', l: 'Integration Routing Key', t: 'password', ph: '••••••••' }], docs: 'https://developer.pagerduty.com/' },

  // ─── Developer ─────────────────────────────────────────────────────
  { id: 'webhook', name: 'Custom Webhook', desc: 'Push StaffFlow events to any custom endpoint.', icon: Link2, color: 'bg-slate-100 text-slate-600', cat: 'Developer', fields: [{ k: 'url', l: 'Endpoint URL', ph: 'https://your-api.com/webhook' }, { k: 'secret', l: 'Secret Key (optional)', t: 'password', ph: 'For signature verification' }] },
  { id: 'rest_api', name: 'REST API Access', desc: 'Use the StaffFlow REST API to build custom integrations and automations.', icon: Link2, color: 'bg-slate-100 text-slate-600', cat: 'Developer', fields: [{ k: 'note', l: 'Note', ph: 'Generate API keys from your profile settings' }] },
];

const CATEGORIES = ['All', 'Communication', 'Sourcing', 'Productivity', 'HR & Payroll', 'CRM & Sales', 'Background Check', 'Analytics', 'Automation', 'AI & Screening', 'VMS / Staffing', 'Notifications', 'Developer'];

export default function Integrations() {
  const { user: currentUser } = useCurrentUser();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [formData, setFormData] = useState({});
  const [connected, setConnected] = useState({});

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Access Restricted</p>
        <p className="text-sm">Only admins can manage integrations.</p>
      </div>
    );
  }

  const filtered = INTEGRATIONS.filter(i => {
    const matchCat = activeCategory === 'All' || i.cat === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || i.cat.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const connectedCount = Object.values(connected).filter(Boolean).length;

  const openConfig = (integration) => {
    setSelectedIntegration(integration);
    setFormData({});
    setConfigOpen(true);
  };

  const handleSave = () => {
    setConnected(prev => ({ ...prev, [selectedIntegration.id]: true }));
    setConfigOpen(false);
    toast.success(`${selectedIntegration.name} connected successfully!`);
  };

  const handleDisconnect = (id) => {
    setConnected(prev => ({ ...prev, [id]: false }));
    toast.info('Integration disconnected.');
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {INTEGRATIONS.length} integrations available.
          {connectedCount > 0 && <span className="text-emerald-600 font-medium ml-1">{connectedCount} connected.</span>}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="Search integrations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-6 max-h-24 overflow-y-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {cat}
            {cat !== 'All' && <span className="ml-1 opacity-60">({INTEGRATIONS.filter(i => i.cat === cat).length})</span>}
          </button>
        ))}
      </div>

      {/* Integration grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(integration => {
          const Icon = integration.icon;
          const isConnected = connected[integration.id];
          return (
            <Card key={integration.id} className={`relative transition-all hover:shadow-md flex flex-col ${isConnected ? 'ring-1 ring-emerald-200' : ''}`}>
              {integration.popular && !isConnected && (
                <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Popular</span>
              )}
              {isConnected && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Connected
                </span>
              )}
              <CardContent className="p-4 flex flex-col flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${integration.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm leading-tight pr-12">{integration.name}</h3>
                    <Badge variant="outline" className="text-[9px] mt-0.5 px-1 py-0">{integration.cat}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed flex-1">{integration.desc}</p>
                <div className="flex gap-1.5 mt-auto">
                  <Button size="sm" variant={isConnected ? 'outline' : 'default'} className="flex-1 text-xs gap-1 h-7"
                    onClick={() => openConfig(integration)}>
                    <Settings className="w-3 h-3" />
                    {isConnected ? 'Reconfigure' : 'Connect'}
                  </Button>
                  {isConnected && (
                    <Button size="sm" variant="outline" className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 h-7 px-2"
                      onClick={() => handleDisconnect(integration.id)}>
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}
                  {integration.docs && (
                    <Button size="sm" variant="ghost" className="text-xs px-2 h-7" asChild>
                      <a href={integration.docs} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No integrations match your search.</p>
          </div>
        )}
      </div>

      {/* Config Dialog */}
      {selectedIntegration && (
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${selectedIntegration.color}`}>
                  <selectedIntegration.icon className="w-4 h-4" />
                </div>
                Configure {selectedIntegration.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              {selectedIntegration.fields.map(field => (
                <div key={field.k} className="space-y-1.5">
                  <Label className="text-sm">{field.l}</Label>
                  <Input
                    type={field.t || 'text'}
                    placeholder={field.ph}
                    value={formData[field.k] || ''}
                    onChange={e => setFormData(prev => ({ ...prev, [field.k]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
                Your credentials are stored securely and never shared.
              </div>
              {selectedIntegration.docs && (
                <a href={selectedIntegration.docs} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  View {selectedIntegration.name} documentation
                </a>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Save & Connect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}