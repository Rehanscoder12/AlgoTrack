# AlgoTrack

### Your DSA & Computer Science Preparation Companion

AlgoTrack is a student-friendly platform designed to make **DSA practice and Computer Science preparation easier, organized, and accessible**.

It brings coding questions, study materials, and useful learning resources together in one place, helping students understand what to practice and how to prepare for technical interviews and academics.

🌐 **Live Website:** [https://algo-track-two.vercel.app/](https://algo-track-two.vercel.app/)

---

## About the Project

Many students, especially beginners, struggle to find a proper learning path for Data Structures and Algorithms and core Computer Science subjects.

They often have questions like:

- Which DSA problems should I solve?
- Which topics should I learn first?
- Where can I find good notes and video lectures?
- How can I keep track of my preparation?
- What should I study for technical interviews?

AlgoTrack aims to make this process simpler by providing a centralized place to organize practice questions, track personal progress, and discover useful study resources.

**Built by students, for students.**

## Features

### DSA Practice Tracker
- Browse coding questions by topic and difficulty.
- Find questions from platforms like LeetCode, GeeksforGeeks, and others.
- Open problems directly on their original platforms.
- Track solved questions and personal progress.

### Computer Science Resources
- Access resources for core CS subjects.
- Explore notes, PDFs, videos, websites, and practice materials.
- Find useful resources for academic preparation and technical interviews.

### Personal Progress
- Mark questions as completed.
- Track your preparation progress.
- Your progress is stored locally in your browser.
- No account or signup is required.

### Learning Resources
- Watch supported videos directly on the website.
- Open external learning materials.
- Keep useful study resources organized in one place.

### Simple and Student-Friendly
- Clean and responsive interface.
- Easy to use on desktop and mobile.
- Public access without visitor login.

## How to Use AlgoTrack

1. Visit the [AlgoTrack website](https://algo-track-two.vercel.app/).
2. Browse DSA questions by topic or difficulty.
3. Open a question and solve it on the original coding platform.
4. Mark the question as completed to track your progress.
5. Explore Computer Science resources for subjects you are studying.
6. Use notes, videos, and practice links to continue learning.

Your progress is saved in your browser, so it is personal to that browser and device.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development and build tool |
| Tailwind CSS | Styling |
| Supabase | Database and backend |
| Supabase Edge Functions | Secure admin operations |
| Vercel | Deployment |

## Getting Started

Want to run AlgoTrack locally or contribute to the project?

### Prerequisites

- Node.js 18 or later
- npm
- A Supabase account for shared content and admin functionality

### 1. Clone the Repository

```bash
git clone https://github.com/Rehanscoder12/AlgoTrack.git
```

### 2. Navigate to the Project

```bash
cd AlgoTrack
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and add your Supabase project details.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use your Supabase project URL and anon/publishable key.

Never put your Supabase service role key or admin secrets in frontend environment variables.

### 5. Set Up Supabase

- Create a Supabase project.
- Run `supabase/schema.sql` in the Supabase SQL Editor.
- Run `supabase/migrations/20261125_dsa_sections.sql` after `schema.sql` to add admin-managed DSA sections, topics, and question links.
- Configure the required environment variables.
- Deploy the `admin-content` Edge Function if you need admin functionality.

The public pages can run without Supabase configuration as an empty-state preview. Shared content and admin operations require a configured backend.

#### Apply the DSA sections migration to an existing project

Back up the database first. In the Supabase Dashboard, open **SQL Editor**, paste the contents of `supabase/migrations/20261125_dsa_sections.sql`, and run it. The migration only creates the three section/link tables, their indexes, read-only RLS policies, and grants. It does not update or delete existing questions or resources, and can be safely rerun.

After applying it, redeploy the existing admin function so its section, topic, ordering, and question-link actions are available:

```bash
npx supabase functions deploy admin-content
```

Questions remain stored once in `questions`; `dsa_topic_questions` links a question to one or more section topics. Deleting a section or topic only removes its links, while deleting a question through the existing global question manager removes its links through the foreign-key cascade.

### 6. Start the Development Server

```bash
npm run dev
```

To create a production build:

```bash
npm run build
```

## Secure Owner Admin

AlgoTrack does not provide public accounts, signup, or visitor authentication.

The owner can manage shared questions and resources through the protected admin interface.

Admin security is handled by the `admin-content` Supabase Edge Function:

- The admin password is verified server-side.
- The function issues a short-lived signed admin token.
- Create, update, and delete operations are verified by the Edge Function.
- The Supabase service role key stays on the server and is never exposed to the browser.

### Deploy the Edge Function

Log in to the Supabase CLI and link your project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

Set the required function secrets:

```bash
npx supabase secrets set ADMIN_PASSWORD='your-strong-admin-password'
npx supabase secrets set ADMIN_SESSION_SECRET='your-random-secret-at-least-32-characters'
```

Deploy the function:

```bash
npx supabase functions deploy admin-content
```

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions.

Keep these secrets server-side. Do not enable public insert, update, or delete policies. Public visitors should only be able to read shared content.

## Data and Progress

- Shared questions and resources are stored in Supabase.
- Public content is readable without an account.
- Database access is protected using Row Level Security (RLS).
- Personal question progress is stored in browser `localStorage`.
- Personal progress is not sent to Supabase.

Clearing browser storage or using another browser/device may reset or change your locally stored progress.

## Contributing

AlgoTrack is built to help students learn together. Contributions from students and developers are welcome!

You can contribute by:

- Suggesting useful DSA questions.
- Sharing quality Computer Science study resources.
- Reporting bugs or UI issues.
- Improving documentation.
- Fixing bugs or implementing new features.

### How to Contribute Code

1. Fork this repository.
2. Create a new branch.
3. Make your changes.
4. Test your changes locally.
5. Commit and push your branch.
6. Open a Pull Request explaining your changes.

For content suggestions, open a GitHub Issue with the question or resource details and its original source link.

Please make sure shared resources are useful, relevant, and accessible to students.

## Roadmap

AlgoTrack will continue to improve as more students use it.

Some planned improvements include:

- More DSA questions and topic-wise organization.
- Additional Computer Science study resources.
- Improved learning paths for beginners.
- Better progress tracking.
- Community-driven contributions.

Have an idea? Feel free to open an issue and share it!

## Support the Project

If AlgoTrack helps you in your preparation:

- ⭐ Star this repository.
- Share the website with your classmates and juniors.
- Contribute useful questions and resources.
- Help improve the project.

Every contribution helps make learning easier for more students.

---

## Creator

**Created & founded by Rehans Pathak**

AlgoTrack is a student-built project created to make DSA and Computer Science preparation more organized and accessible.

[GitHub Repository](https://github.com/Rehanscoder12/AlgoTrack) · [Live Website](https://algo-track-two.vercel.app/)

