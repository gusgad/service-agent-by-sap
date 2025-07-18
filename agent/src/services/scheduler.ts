import cron from 'node-cron';
import { Op } from 'sequelize';
import { JobStatus, JobType } from '../helpers/types';
import { Job } from '../db/init';

export function startScheduler(): void {
  const cronSchedule: string = process.env.SCHEDULER_CRON || '* * * * *';
  
  cron.schedule(cronSchedule, async () => {
    try {
      console.log('Checking for scheduled jobs...', new Date().toISOString());
      const jobs = await Job.findAll({
        where: {
          jobType: JobType.SCHEDULED,
          status: JobStatus.PENDING,
          scheduledAt: {
            [Op.lte]: new Date()
          }
        }
      });

      console.log(`Found ${jobs.length} scheduled jobs ready for execution`);
      
      for (const job of jobs) {
        console.log(`Executing scheduled job: ${job.id}`);
        const { executeJob } = await import('../controllers/jobController.js');
        await executeJob(job);
      }
    } catch (error) {
      console.error('Scheduled job processing error:', error);
    }
  });

  console.log(`Scheduler started with cron: ${cronSchedule}`);
}