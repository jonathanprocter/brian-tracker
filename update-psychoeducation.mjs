import { drizzle } from "drizzle-orm/mysql2";
import { mysqlTable, int, varchar, text, timestamp } from "drizzle-orm/mysql-core";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  weekNumber: int("weekNumber").notNull(),
  taskName: varchar("taskName", { length: 255 }).notNull(),
  taskDescription: text("taskDescription").notNull(),
  questDescription: text("questDescription").notNull(),
  psychoeducation: text("psychoeducation"),
  goalDays: int("goalDays").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Psychoeducational content for each week
const psychoeducationContent = {
  1: `**Why This Works:** Standing in your doorway is the first step in exposure therapy. Your brain has learned to associate "outside" with danger, even though it's safe. By standing at the threshold, you're teaching your nervous system that nothing bad happens. This is called "habituation" - the anxiety will naturally decrease the more you practice.

**The Science:** When we avoid things that make us anxious, the anxiety temporarily goes down, but it actually gets stronger over time. By facing the doorway, you're breaking this cycle. Your amygdala (the brain's alarm system) will learn to stop sending false alarms.

**Remember:** Anxiety is uncomfortable but not dangerous. It always peaks and then comes down on its own - usually within 20-30 minutes. You're not trying to eliminate anxiety; you're proving to yourself you can handle it.`,

  2: `**Building on Week 1:** You've shown your brain that doorways are safe. Now we're reinforcing that learning. Repetition is key - the more times you practice without anything bad happening, the weaker the anxiety response becomes.

**What's Happening in Your Brain:** Each time you complete this task, you're strengthening new neural pathways that say "doorway = safe." The old fear pathways are getting weaker from disuse. This is called neuroplasticity - your brain literally rewiring itself.

**Pro Tip:** Notice if your anxiety is slightly lower than Week 1. Even small decreases are significant progress. Your brain is learning.`,

  3: `**Expanding Your Comfort Zone:** Moving from the doorway to the driveway is a natural progression. You're not jumping to something scary - you're taking the next logical step. This is called "graduated exposure."

**Why Gradual Steps Matter:** If we tried to do too much too fast, your brain might get overwhelmed and the anxiety could actually increase. By taking small steps, we keep the anxiety manageable while still making progress.

**The Driveway Principle:** Your driveway is still "your territory" - it's connected to your safe space. This makes it the perfect training ground before venturing further.`,

  4: `**Consolidation Week:** Just like Week 2, this week is about strengthening what you've learned. Your brain needs repetition to make these new pathways permanent.

**Signs of Progress:** You might notice you're less anxious before starting, or the anxiety goes away faster. You might even feel a small sense of accomplishment. These are all signs the exposure therapy is working.

**Important:** Even if anxiety feels the same, you're still making progress. The fact that you're doing it consistently is rewiring your brain.`,

  5: `**Adding Purpose:** Recording a video gives you a reason to be outside beyond just "exposure practice." This is called "behavioral activation" - doing meaningful activities that improve your mood and confidence.

**Why Video Works for You:** You already enjoy content creation. By combining something you like (making videos) with something challenging (being outside), we're making the experience more positive overall.

**The Distraction Factor:** When you're focused on getting a good shot, you're naturally less focused on anxiety. This isn't avoidance - it's redirecting your attention to something productive.`,

  6: `**Building Content Creation Confidence:** The more videos you make outside, the more natural it becomes. You're not just overcoming agoraphobia - you're building skills for your future.

**Dual Benefits:** Each video is proof that you can be outside AND be creative. Save these videos - they're evidence of your progress that you can look back on.

**Challenge Yourself:** Try recording in slightly different spots or at different times. Variety helps generalize your learning to more situations.`,

  7: `**Reconnecting with Your Identity:** Skateboarding isn't just a hobby - it's part of who you are. Agoraphobia may have taken you away from it, but it doesn't define you.

**Why Touch Counts:** Even holding your board starts rebuilding the connection. Your brain associates the board with positive memories of skating. We're reactivating those pathways.

**No Pressure:** You don't have to ride. Just being outside with your board is a win. Any interaction counts - holding it, standing on it, rolling it back and forth.`,

  8: `**Deepening the Connection:** This week, see if you can do a little more with your board than last week. Maybe stand on it, or roll a few feet. But only if it feels right.

**Reclaiming What's Yours:** Agoraphobia tried to take skateboarding from you. Every time you touch that board outside, you're taking it back.

**Future Vision:** Imagine where you want to be with skating in 6 months. These small steps are building toward that goal.`,

  9: `**You're Ready for Choice:** After 8 weeks of structured practice, you've proven you can handle being outside. Now you get to choose what feels right each day.

**Why Choice Matters:** Having options increases your sense of control, which reduces anxiety. You're no longer just following a program - you're making decisions about your own recovery.

**Menu Options:**
• Skateboard outside (any amount)
• Walk around the block
• Sit outside for 10 minutes
• Record a TikTok
• Any other outdoor activity you choose

**The Goal:** Keep building on your progress. The specific activity matters less than the consistency of getting outside regularly.`
};

async function updatePsychoeducation() {
  try {
    console.log("Updating tasks with psychoeducational content...");
    
    for (const [weekNum, content] of Object.entries(psychoeducationContent)) {
      await db.update(tasks)
        .set({ psychoeducation: content })
        .where(eq(tasks.weekNumber, parseInt(weekNum)));
      console.log(`✓ Updated Week ${weekNum}`);
    }
    
    console.log("✓ Psychoeducational content added successfully!");
  } catch (error) {
    console.error("Error updating psychoeducation:", error);
    process.exit(1);
  }
}

updatePsychoeducation();
