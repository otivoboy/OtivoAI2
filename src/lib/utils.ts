import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ProjectFile } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COMMON_FIRST_NAMES = [
  'peter', 'john', 'david', 'alex', 'alexander', 'mary', 'sarah', 'michael', 'james', 'robert',
  'william', 'joseph', 'charles', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'stephen',
  'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy',
  'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'larry', 'justin',
  'scott', 'brandon', 'benjamin', 'samuel', 'gregory', 'frank', 'raymond', 'patrick', 'jack', 'dennis',
  'jerry', 'tyler', 'aaron', 'jose', 'adam', 'henry', 'nathan', 'douglas', 'zachary', 'kyle',
  'walter', 'ethan', 'jeremy', 'harold', 'keith', 'christian', 'roger', 'noah', 'gerald', 'carl',
  'terry', 'sean', 'austin', 'arthur', 'lawrence', 'jesse', 'dylan', 'bryan', 'joe', 'jordan',
  'billy', 'bruce', 'albert', 'willie', 'gabriel', 'logan', 'alan', 'juan', 'wayne', 'roy',
  'ralph', 'randy', 'eugene', 'vincent', 'russell', 'louis', 'philip', 'bobby', 'johnny', 'bradley',
  'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'karen', 'nancy',
  'lisa', 'margaret', 'betty', 'sandra', 'ashley', 'dorothy', 'kimberly', 'emily', 'donna', 'michelle',
  'carol', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia', 'kathleen',
  'amy', 'shirley', 'angela', 'helen', 'anna', 'brenda', 'pamela', 'nicole', 'samantha', 'katherine',
  'emma', 'christine', 'debra', 'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather', 'diane',
  'virginia', 'julie', 'joyce', 'victoria', 'kelly', 'christina', 'lauren', 'joan', 'evelyn', 'judith',
  'megan', 'cheryl', 'andrea', 'hannah', 'martha', 'jacqueline', 'faye', 'gloria', 'teresa', 'kathryn',
  'sara', 'janice', 'jean', 'alice', 'madison', 'dora', 'abigail', 'julia', 'judy', 'grace',
  'denise', 'amber', 'doris', 'marilyn', 'beverly', 'danielle', 'theresa', 'diana', 'brittany', 'natalie',
  'sophia', 'rose', 'isabella', 'alexis', 'kayla', 'charlotte'
];

export function extractFirstName(name?: string, email?: string): string {
  let target = (name && name.trim()) ? name.trim() : '';

  if (!target || target.includes('@')) {
    target = email ? email.split('@')[0] : (target ? target.split('@')[0] : '');
  }

  if (!target) return '';

  // 1. If contains space (e.g. "Peter Nderitu"), take first word
  if (target.includes(' ')) {
    target = target.split(/\s+/)[0];
  }

  // 2. If contains separators like . _ - + (e.g. "peter.nderitu"), split and take first
  if (/[._\-+]/.test(target)) {
    target = target.split(/[._\-+]/)[0];
  }

  // Lowercase string for analysis
  const lower = target.toLowerCase();

  // 3. Check if lower string starts with any known common first name
  const sortedNames = COMMON_FIRST_NAMES.slice().sort((a, b) => b.length - a.length);
  for (const fn of sortedNames) {
    if (lower.startsWith(fn)) {
      return fn.charAt(0).toUpperCase() + fn.slice(1);
    }
  }

  // 4. Remove trailing digits or embedded numbers (e.g. "peter321" -> "peter")
  const strippedDigits = target.replace(/\d+/g, '');
  if (strippedDigits) {
    target = strippedDigits;
  }

  // 5. CamelCase split if present (e.g. "peterNderitu" -> "peter")
  const camelPart = target.split(/(?=[A-Z])/)[0];
  if (camelPart && camelPart.length >= 2) {
    target = camelPart;
  }

  if (!target) return '';

  return target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
}

export function formatAuthError(err: any): string {
  if (!err) return 'An error occurred. Please try again.';
  const code = err.code || '';
  const rawMsg = typeof err === 'string' ? err : (err.message || String(err));

  if (code === 'auth/network-request-failed' || rawMsg.includes('network-request-failed')) {
    return 'Authentication issue. Please check your Email address and Password, or verify your internet connection.';
  }
  if (
    code === 'auth/invalid-credential' || 
    code === 'auth/wrong-password' || 
    code === 'auth/user-not-found' || 
    rawMsg.includes('invalid-credential') || 
    rawMsg.includes('wrong-password') || 
    rawMsg.includes('user-not-found')
  ) {
    return 'Incorrect email or password. Please check your Email address and Password and try again.';
  }
  if (code === 'auth/invalid-email' || rawMsg.includes('invalid-email')) {
    return 'Invalid email format. Please check your Email address.';
  }
  if (code === 'auth/email-already-in-use' || rawMsg.includes('email-already-in-use')) {
    return 'An account with this email address already exists. Try logging in instead.';
  }
  if (code === 'auth/weak-password' || rawMsg.includes('weak-password')) {
    return 'Password is too weak. Please enter at least 6 characters.';
  }
  if (code === 'auth/too-many-requests' || rawMsg.includes('too-many-requests')) {
    return 'Too many login attempts. Please wait a moment before trying again.';
  }
  if (code === 'auth/popup-closed-by-user' || rawMsg.includes('popup-closed-by-user')) {
    return 'Google sign-in window was closed before completing.';
  }

  // Remove raw "Firebase: Error (auth/...)" wrapper if present
  let cleaned = rawMsg.replace(/^Firebase:\s*Error\s*\(auth\/[^)]+\)\.?\s*/i, '').trim();
  if (!cleaned || cleaned.toLowerCase().includes('firebase')) {
    return 'Sign in failed. Please check your Email address and Password, then try again.';
  }

  return cleaned;
}

export function deduplicateFiles(files: ProjectFile[]): ProjectFile[] {
  const map = new Map<string, ProjectFile>();
  files.forEach(file => {
    // Normalize path: remove leading ./ and /
    const normalizedPath = file.path.replace(/^\.\//, '').replace(/^\//, '');
    map.set(normalizedPath, {
      ...file,
      path: normalizedPath
    });
  });
  return Array.from(map.values());
}

export function normalizeProjectFiles(files: ProjectFile[]): ProjectFile[] {
  if (files.length === 0) return files;

  // Filter out any empty paths or weird entries
  const validFiles = files.filter(f => f.path && f.path.trim() !== '');
  if (validFiles.length === 0) return files;

  const paths = validFiles.map(f => f.path);
  
  // Check if all files share the same first directory
  // We only do this if there are multiple files or if the single file is in a subdirectory
  const firstPathParts = paths[0].split('/');
  if (firstPathParts.length <= 1 && paths.length > 1) {
    // Check if ANY file is at the root. If yes, we don't normalize.
    const hasFileAtRoot = paths.some(p => !p.includes('/'));
    if (hasFileAtRoot) return validFiles;
  }

  const firstDir = firstPathParts[0];
  if (!firstDir) return validFiles;

  const allShareFirstDir = paths.every(p => p.startsWith(firstDir + '/'));

  if (allShareFirstDir) {
    const normalized = validFiles.map(f => ({
      ...f,
      path: f.path.substring(firstDir.length + 1)
    }));
    // Recursively check for more common folders
    return normalizeProjectFiles(normalized);
  }

  return validFiles;
}

export async function overlayLogo(base64Image: string, base64Logo: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      
      const logo = new Image();
      logo.crossOrigin = "anonymous";
      logo.onload = () => {
        const padding = Math.min(canvas.width, canvas.height) * 0.05;
        const maxLogoSize = Math.min(canvas.width, canvas.height) * 0.2; // 20% of image size
        
        let logoWidth = logo.width;
        let logoHeight = logo.height;
        
        if (logoWidth > logoHeight) {
          logoHeight = (maxLogoSize / logoWidth) * logoHeight;
          logoWidth = maxLogoSize;
        } else {
          logoWidth = (maxLogoSize / logoHeight) * logoWidth;
          logoHeight = maxLogoSize;
        }
        
        // Top right placement
        ctx.drawImage(logo, canvas.width - logoWidth - padding, padding, logoWidth, logoHeight);
        resolve(canvas.toDataURL('image/png').split(',')[1]);
      };
      logo.onerror = (e) => reject(new Error('Failed to load logo: ' + e));
      logo.src = base64Logo.startsWith('data:') ? base64Logo : `data:image/png;base64,${base64Logo}`;
    };
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = base64Image.startsWith('data:') ? base64Image : `data:image/png;base64,${base64Image}`;
  });
}

export function playSuccessSound() {
  const audio = new Audio('/sounds/success.mp3');
  audio.volume = 0.6;
  audio.play().catch(() => {
    // Fallback to simple beep
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  });
}

export function playErrorSound() {
  const audio = new Audio('/sounds/error.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  });
}

export function playFixSound() {
  const audio = new Audio('/sounds/fix.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  });
}

export function transformFilesToWebContainer(files: ProjectFile[]) {
  const tree: any = {};
  files.forEach(file => {
    if (!file.path) return;
    const parts = file.path.split('/');
    let current = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = { directory: {} };
      }
      current = current[part].directory;
    }
    const fileName = parts[parts.length - 1];
    
    let contents: string | Uint8Array = file.content;
    if (file.encoding === 'base64') {
      const binaryString = atob(file.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      contents = bytes;
    }

    current[fileName] = {
      file: {
        contents
      }
    };
  });
  return tree;
}
