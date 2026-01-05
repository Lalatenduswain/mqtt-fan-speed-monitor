import cron from 'node-cron';
import { Schedule } from '../models/Schedule.js';
import { Device } from '../models/Device.js';
import { sendDeviceCommand } from './mqttService.js';

const scheduledTasks = new Map();

export function initScheduler() {
  console.log('Initializing scheduler...');
  loadSchedules();
}

export function loadSchedules() {
  // Clear existing scheduled tasks
  for (const [id, task] of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.clear();

  // Load enabled schedules from database
  const schedules = Schedule.getEnabled();
  console.log(`Loading ${schedules.length} enabled schedules`);

  for (const schedule of schedules) {
    try {
      if (!cron.validate(schedule.cron_expression)) {
        console.error(`Invalid cron expression for schedule ${schedule.id}: ${schedule.cron_expression}`);
        continue;
      }

      const task = cron.schedule(schedule.cron_expression, () => {
        executeSchedule(schedule);
      }, {
        scheduled: true,
        timezone: process.env.TZ || 'Asia/Kolkata'
      });

      scheduledTasks.set(schedule.id, task);
      console.log(`Scheduled: ${schedule.name} (${schedule.cron_expression})`);
    } catch (error) {
      console.error(`Failed to schedule ${schedule.id}:`, error);
    }
  }

  console.log(`Scheduler loaded ${scheduledTasks.size} tasks`);
}

export function reloadSchedules() {
  console.log('Reloading schedules...');
  loadSchedules();
}

async function executeSchedule(schedule) {
  console.log(`Executing schedule: ${schedule.name}`);

  try {
    const device = Device.getById(schedule.device_id);
    if (!device) {
      console.error(`Device not found for schedule: ${schedule.device_id}`);
      return;
    }

    // Send command to device
    await sendDeviceCommand(device, schedule.action);

    // Update device state optimistically
    Device.updateState(device.id, schedule.action);

    // Update last run time
    Schedule.setLastRun(schedule.id);

    console.log(`Schedule executed: ${schedule.name} -> ${JSON.stringify(schedule.action)}`);
  } catch (error) {
    console.error(`Failed to execute schedule ${schedule.name}:`, error);
  }
}

export function getScheduledTasks() {
  return Array.from(scheduledTasks.keys());
}

export function stopScheduler() {
  console.log('Stopping scheduler...');
  for (const [id, task] of scheduledTasks) {
    task.stop();
  }
  scheduledTasks.clear();
}
