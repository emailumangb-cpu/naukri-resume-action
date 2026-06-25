import * as core from '@actions/core';
import * as fs from 'fs';
import { login } from './api/login';
import { uploadResume } from './api/uploadResume';
import { updateProfileSummary } from './api/updateProfile';
import { updateResumeHeadline } from './api/updateResumeHeadline';

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Get user inputs
    const username = core.getInput('username');
    const password = core.getInput('password');
    const profileId = core.getInput('profile_id');
    const resumePathInput = core.getInput('resume_path');
    let profileSummary = core.getInput('profile_summary');
    const resumeHeadline = core.getInput('resume_headline');

    // Mask sensitive inputs
    core.setSecret(username);
    core.setSecret(password);
    core.setSecret(profileId);

    // Parse resume paths (could be a single filename or multiple filenames in YAML array format)
    // All paths are resolved relative to the ./resumes/ directory
    const RESUME_DIR = './resumes';

    let resumeFilenames: string[] = [];

    if (resumePathInput.includes('\n')) {
      resumeFilenames = resumePathInput
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
    } else {
      resumeFilenames = [resumePathInput];
    }

    if (resumeFilenames.length === 0) {
      throw new Error('🚫 No valid resume paths provided');
    }

    const resumePaths = resumeFilenames.map((f) => `${RESUME_DIR}/${f}`);

    const validResumePaths = resumePaths.filter((path) => {
      const exists = fs.existsSync(path);
      if (!exists) {
        core.warning(`⚠️ Resume file not found: ${path}`);
      }
      return exists;
    });

    if (validResumePaths.length === 0) {
      throw new Error('🚫 No valid resume files found in ./resumes/ directory');
    }

    // Select resume based on date for deterministic selection
    // This provides a consistent way to rotate resumes based on the calendar
    const today = new Date();
    const dayOfMonth = today.getDate(); // 1-31
    const dayOfWeek = today.getDay(); // 0-6 (Sunday is 0)
    const month = today.getMonth(); // 0-11

    // Combine day of month, day of week, and month for better distribution
    const selectionFactor =
      (dayOfMonth + dayOfWeek * 5 + month * 31) % validResumePaths.length;

    const selectedResume = validResumePaths[selectionFactor];

    core.info(`📄 Selected resume for upload: ${selectedResume}`);
    core.info(
      `📅 Selection based on date: Day ${dayOfMonth}, Weekday ${dayOfWeek}, Month ${month + 1}`
    );
    core.setOutput('selected_resume 📄', selectedResume);

    // Login to Naukri
    core.info('🔐 Logging in to Naukri.com...');
    const cookies = await login(username, password);

    if (!cookies) {
      throw new Error('❌ Login failed');
    }

    // Optionally update profile summary if provided
    if (profileSummary) {
      // Validate profile summary length (minimum 50, maximum 900 characters)
      const summaryLen = profileSummary.trim().length;
      if (summaryLen < 50) {
        core.warning(
          `⚠️ Profile summary is too short (${summaryLen} chars). Minimum 50 characters required. Skipping profile update.`
        );
      } else if (summaryLen > 900) {
        core.warning(
          `⚠️ Profile summary is too long (${summaryLen} chars). Maximum 900 characters allowed. Skipping profile update.`
        );
      } else {
        core.info('🔄 Updating profile summary...');
        // add a unique time stamp at the end of profile summary
        profileSummary += ` ${new Date().getTime()}`;
        try {
          const ok = await updateProfileSummary(
            cookies,
            profileId,
            profileSummary
          );
          if (ok) core.info('✅ Profile summary updated');
          else
            core.warning(
              '⚠️ Profile summary update failed (API returned non-2xx)'
            );
        } catch (err) {
          core.warning(
            `⚠️ Profile summary update error: ${(err as Error).message}`
          );
        }
      }
    }

    // Optionally update resume headline if provided
    if (resumeHeadline) {
      if (resumeHeadline.trim().length > 250) {
        core.warning(
          `⚠️ Resume headline is too long (${resumeHeadline.trim().length} chars). Maximum 250 characters allowed. Skipping headline update.`
        );
      } else {
        core.info('📝 Updating resume headline...');
        try {
          const headlineOk = await updateResumeHeadline(
            cookies,
            profileId,
            resumeHeadline.trim()
          );
          if (headlineOk) core.info('✅ Resume headline updated');
          else
            core.warning(
              '⚠️ Resume headline update failed (API returned non-2xx)'
            );
        } catch (err) {
          core.warning(
            `⚠️ Resume headline update error: ${(err as Error).message}`
          );
        }
      }
    }

    // Upload the resume
    core.info('⬆️ Uploading resume...');
    const success = await uploadResume(cookies, selectedResume, profileId);

    // Set outputs
    core.setOutput('upload_status 🚀', success ? 'success ✅' : 'failure ❌');
    core.setOutput('upload_time 🕒', new Date().toISOString());

    if (success) {
      core.info('✅ Resume uploaded successfully!');
    } else {
      core.setFailed('❌ Resume upload failed');
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(`❗ ${error.message}`);
  }
}
