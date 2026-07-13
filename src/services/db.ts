import type { ImageWorkspace, Folder } from '../types/workspace';

const DB_NAME = 'MeasureWorkspaceDB';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const RECORD_KEY = 'current_workspace';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveWorkspace(images: ImageWorkspace[], folders: Folder[], currentImageId: string | null): Promise<void> {
  try {
    const db = await getDB();
    
    // Create a deep copy of images, strip non-serializable imgObject
    const serializableImages = images.map((img) => {
      return {
        id: img.id,
        name: img.name,
        src: img.src,
        lines: JSON.parse(JSON.stringify(img.lines)),
        referenceLine: img.referenceLine ? JSON.parse(JSON.stringify(img.referenceLine)) : null,
        referenceLength: img.referenceLength,
        unit: img.unit,
        scale: img.scale,
        dpi: img.dpi,
        zoomLevel: img.zoomLevel,
        panX: img.panX,
        panY: img.panY,
        folderId: img.folderId || null,
        imgObject: null // Strip out DOM image object
      };
    });

    const dataToSave = {
      images: serializableImages,
      folders: JSON.parse(JSON.stringify(folders)),
      currentImageId,
      updatedAt: new Date().toISOString()
    };

    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(dataToSave, RECORD_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save to IndexedDB', err);
  }
}

export async function loadWorkspace(): Promise<{ images: ImageWorkspace[]; folders: Folder[]; currentImageId: string | null } | null> {
  try {
    const db = await getDB();

    const data = await new Promise<any>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(RECORD_KEY);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!data) return null;

    // Deserialization: Re-create HTMLImageElement instances from base64 sources
    const restoredImages = data.images.map((img: any) => {
      const imageWorkspace: ImageWorkspace = {
        ...img,
        imgObject: null
      };

      if (img.src) {
        const htmlImg = new Image();
        htmlImg.onload = () => {
          imageWorkspace.imgObject = htmlImg;
        };
        htmlImg.src = img.src;
      }

      return imageWorkspace;
    });

    return {
      images: restoredImages,
      folders: data.folders || [],
      currentImageId: data.currentImageId || null
    };
  } catch (err) {
    console.error('Failed to load from IndexedDB', err);
    return null;
  }
}
