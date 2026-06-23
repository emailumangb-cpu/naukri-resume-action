import * as core from '@actions/core';
import * as fs from 'fs';
import { fetchProfileId } from './api/fetchProfileId';
import { login } from './api/login';
import { uploadResume } from './api/uploadResume';
import {
  MAX_HEADLINE_LENGTH,
  MAX_SUMMARY_LENGTH,
  MIN_SUMMARY_LENGTH,
  normalizeHeadline,
  updateProfileFields,
  type ProfileFieldUpdates
} from './api/updateProfileFields';

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
    const profileIdInput = core.getInput('profile_id');
    const resumePathInput = core.getInput('resume_path');
    let profileSummary = core.getInput('profile_summary');
    const resumeHeadline = core.getInput('resume_headline');

    // Mask sensitive inputs
    core.setSecret(username);
    core.setSecret(password);
    core.setSecret(profileIdInput);

    // Login to Naukri
    core.info('🔐 Logging in to Naukri.com...');
    const cookies = await login(username, password);

    if (!cookies) {
      throw new Error('❌ Login failed');
    }

    const fetchedProfileId = await fetchProfileId(cookies);
    const profileId = fetchedProfileId ?? profileIdInput;

    if (fetchedProfileId && fetchedProfileId !== profileIdInput) {
      core.warning(
        `⚠️ Using profile ID from Naukri dashboard (${fetchedProfileId}). CSV value was ${profileIdInput}.`
      );
    } else if (!fetchedProfileId) {
      core.warning(
        `⚠️ Could not fetch profile ID from dashboard. Using CSV value ${profileIdInput}.`
      );
    }

    core.info(`👤 Active profile ID: ${profileId}`);

    const profileUpdates: ProfileFieldUpdates = {};
    let requestedProfileUpdate = false;

    if (profileSummary) {
      profileSummary = profileSummary.trim();

      if (profileSummary.length < MIN_SUMMARY_LENGTH) {
        core.warning(
          `⚠️ Profile summary is too short (${profileSummary.length} chars). Minimum ${MIN_SUMMARY_LENGTH} characters required. Skipping profile summary update.`
        );
      } else if (profileSummary.length > MAX_SUMMARY_LENGTH) {
        core.warning(
          `⚠️ Profile summary is too long (${profileSummary.length} chars). Maximum ${MAX_SUMMARY_LENGTH} characters allowed. Truncating.`
        );
        requestedProfileUpdate = true;
        profileUpdates.summary = `${profileSummary.slice(0, MAX_SUMMARY_LENGTH).trimEnd()} ${Date.now()}`;
      } else {
        requestedProfileUpdate = true;
        profileUpdates.summary = `${profileSummary} ${Date.now()}`;
      }
    }

    if (resumeHeadline) {
      requestedProfileUpdate = true;
      const { value, truncated } = normalizeHeadline(resumeHeadline);

      if (truncated) {
        core.warning(
          `⚠️ Resume headline is too long (${resumeHeadline.trim().length} chars). Truncating to ${MAX_HEADLINE_LENGTH} characters for Naukri.`
        );
      }

      profileUpdates.resumeHeadline = value;
    }

    let profileUpdateSucceeded = true;

    if (Object.keys(profileUpdates).length > 0) {
      const updateFields = Object.keys(profileUpdates).join(', ');
      core.info(`🔄 Updating profile fields: ${updateFields}`);

      try {
        profileUpdateSucceeded = await updateProfileFields(
          cookies,
          profileId,
          profileUpdates
        );

        if (profileUpdateSucceeded) {
          if (profileUpdates.summary) {
            core.info('✅ Profile summary updated');
          }
          if (profileUpdates.resumeHeadline) {
            core.info('✅ Resume headline updated');
          }
        } else {
          core.warning(
            '⚠️ Profile update failed (API returned non-success response)'
          );
        }
      } catch (err) {
        profileUpdateSucceeded = false;
        core.warning(
          `⚠️ Profile update error: ${(err as Error).message}`
        );
      }
    }

    // Parse and validate resume paths (separate from profile update)
    // so profile update runs even if resume file is missing
    let uploadSucceeded = false;
    let selectedResume = '';

    let resumePaths: string[] = [];

    if (resumePathInput.includes('\n')) {
      resumePaths = resumePathInput
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));
    } else {
      resumePaths = [resumePathInput];
    }

    const validResumePaths = resumePaths.filter((path) => {
      const exists = fs.existsSync(path);
      if (!exists) {
        core.warning(`⚠️ Resume file not found: ${path}`);
      }
      return exists;
    });

    if (validResumePaths.length > 0) {
      const today = new Date();
      const dayOfMonth = today.getDate();
      const dayOfWeek = today.getDay();
      const month = today.getMonth();

      const selectionFactor =
        (dayOfMonth + dayOfWeek * 5 + month * 31) % validResumePaths.length;

      selectedResume = validResumePaths[selectionFactor];

      core.info(`📄 Selected resume for upload: ${selectedResume}`);
      core.info(
        `📅 Selection based on date: Day ${dayOfMonth}, Weekday ${dayOfWeek}, Month ${month + 1}`
      );
      core.setOutput('selected_resume 📄', selectedResume);

      core.info('⬆️ Uploading resume...');
      uploadSucceeded = await uploadResume(cookies, selectedResume, profileId);

      if (uploadSucceeded) {
        core.info('✅ Resume uploaded successfully!');
      }
    } else {
      core.warning('⚠️ No valid resume files found. Skipping resume upload.');
    }

    // Set outputs
    core.setOutput('upload_status 🚀', uploadSucceeded ? 'success ✅' : 'failure ❌');
    core.setOutput('upload_time 🕒', new Date().toISOString());
    core.setOutput(
      'profile_update_status 📝',
      profileUpdateSucceeded ? 'success ✅' : 'failure ❌'
    );

    if (requestedProfileUpdate && !profileUpdateSucceeded) {
      core.setFailed('❌ Profile summary/headline update failed');
      return;
    }

    if (validResumePaths.length > 0 && !uploadSucceeded) {
      core.setFailed('❌ Resume upload failed');
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(`❗ ${error.message}`);
  }
}
