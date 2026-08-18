SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict bzoolwPS604XV7pkP1ThJjNr7VRKMgoCk96ofD6Mc4oG7BvODNK7zbyhzzI4GSU

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."profiles" ("id", "full_name", "avatar_url", "role", "created_at") FROM stdin;
ee814c26-c15f-4806-adcd-9f069bbbbcf9	Harshita	\N	admin	2026-08-18 20:41:35.503446+00
c6b82560-2d0b-47e7-b7c3-ad2cc4aa2194	Claire	\N	member	2026-08-18 21:40:22.131236+00
4f21a71b-04c1-4757-bd14-d69a863a597f	John	\N	member	2026-08-18 21:42:58.890424+00
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."projects" ("id", "name", "description", "status", "created_by", "created_at", "updated_at") FROM stdin;
a04a399e-774d-43ad-85b6-e0e3542eafff	Aurora Web Platform	Delivering the Aurora Web Platform initiative for Northwind Labs.	active	ee814c26-c15f-4806-adcd-9f069bbbbcf9	2026-08-18 21:13:39.684143+00	2026-08-18 21:13:39.684143+00
9447db23-92ef-4953-80b2-eab07efb49bc	Orion API Gateway	Delivering the Orion API Gateway initiative for Nimbus Cloud.	archived	ee814c26-c15f-4806-adcd-9f069bbbbcf9	2026-08-18 21:14:05.98978+00	2026-08-18 21:14:05.98978+00
01320711-e718-4e3e-8a69-ae1a93ba4ad1	Helix Design System	Delivering the Helix Design System initiative for Internal.	active	ee814c26-c15f-4806-adcd-9f069bbbbcf9	2026-08-18 21:14:30.53988+00	2026-08-18 21:14:30.53988+00
0f783eb1-d3df-4c2b-8b50-93ba1e0149e6	Nova Onboarding Flow	Delivering the Nova Onboarding Flow initiative for Fintech Alpha.	active	ee814c26-c15f-4806-adcd-9f069bbbbcf9	2026-08-18 21:14:53.78809+00	2026-08-18 21:14:53.78809+00
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."tasks" ("id", "project_id", "assigned_to", "title", "description", "status", "priority", "due_date", "created_at", "updated_at", "created_by") FROM stdin;
a73aa045-d089-4b31-b581-d3312bdfd258	a04a399e-774d-43ad-85b6-e0e3542eafff	c6b82560-2d0b-47e7-b7c3-ad2cc4aa2194	Design onboarding wireframes	Auto-generated demo task: Design onboarding wireframes.	todo	medium	2026-09-01	2026-08-18 21:43:52.655285+00	2026-08-18 21:43:52.655285+00	ee814c26-c15f-4806-adcd-9f069bbbbcf9
19a0a3f4-95de-45f8-b7d8-dff8d7803b98	01320711-e718-4e3e-8a69-ae1a93ba4ad1	4f21a71b-04c1-4757-bd14-d69a863a597f	Kickoff meeting with client	Auto-generated demo task: Kickoff meeting with client.	todo	urgent	2026-08-20	2026-08-18 21:44:30.007291+00	2026-08-18 21:44:30.007291+00	ee814c26-c15f-4806-adcd-9f069bbbbcf9
15d1b0f8-b730-4fd8-939f-618d5bb4f52f	9447db23-92ef-4953-80b2-eab07efb49bc	4f21a71b-04c1-4757-bd14-d69a863a597f	Frontend ticket queries client call.	Call with client regarding the raised ticket.	todo	high	2026-08-20	2026-08-18 21:45:47.908381+00	2026-08-18 21:45:47.908381+00	c6b82560-2d0b-47e7-b7c3-ad2cc4aa2194
7c38887c-480f-4079-ad97-b6277289d7ef	a04a399e-774d-43ad-85b6-e0e3542eafff	ee814c26-c15f-4806-adcd-9f069bbbbcf9	Draft marketing landing	Auto-generated demo task: Draft marketing landing.	todo	medium	2026-08-21	2026-08-18 21:47:41.203866+00	2026-08-18 21:47:41.203866+00	4f21a71b-04c1-4757-bd14-d69a863a597f
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."comments" ("id", "task_id", "profile_id", "content", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: project_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."project_members" ("project_id", "profile_id", "role", "joined_at") FROM stdin;
\.


--
-- PostgreSQL database dump complete
--

-- \unrestrict bzoolwPS604XV7pkP1ThJjNr7VRKMgoCk96ofD6Mc4oG7BvODNK7zbyhzzI4GSU

RESET ALL;
