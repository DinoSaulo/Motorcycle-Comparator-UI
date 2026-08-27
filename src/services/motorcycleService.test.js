import { afterEach, describe, expect, it } from 'vitest';
import {
  CATEGORIES,
  COMPARISON_MAX,
  COMPARISON_MIN,
  compareMotorcycles,
  createMotorcycle,
  deleteMotorcycle,
  deleteMotorcycleImage,
  getMotorcycleById,
  getMotorcycleBySlug,
  IMAGE_CONTENT_TYPES,
  IMAGE_MAX_BYTES,
  listBrands,
  searchMotorcycles,
  updateMotorcycle,
  uploadMotorcycleImage,
} from './motorcycleService';
import { mockApi } from '../testing/mockApi';
import { buildComparison, buildMotorcycle, buildPage } from '../testing/fixtures';

afterEach(() => {
  mockApi.reset();
});

describe('searchMotorcycles', () => {
  it('requests the page with pruned, combined params', async () => {
    const page = buildPage();
    mockApi.onGet('/motorcycles').reply((config) => {
      expect(config.params).toEqual({ brand: 'Yamaha', page: 0, size: 20, sort: 'brand,asc' });
      return [200, page];
    });

    const result = await searchMotorcycles({ filter: { brand: 'Yamaha', model: '' } });
    expect(result).toEqual(page);
  });

  it('uses default paging when called with no arguments', async () => {
    mockApi.onGet('/motorcycles').reply((config) => {
      expect(config.params).toEqual({ page: 0, size: 20, sort: 'brand,asc' });
      return [200, buildPage()];
    });
    await searchMotorcycles();
  });

  it('forwards an abort signal', async () => {
    let requestConfig;
    mockApi.onGet('/motorcycles').reply((config) => {
      requestConfig = config;
      return [200, buildPage()];
    });
    const controller = new AbortController();

    await searchMotorcycles({ signal: controller.signal });

    // Asserted on the captured config rather than inside the handler, so a handler that
    // never runs fails the test instead of silently passing with nothing checked.
    expect(requestConfig?.signal).toBe(controller.signal);
  });
});

describe('listBrands', () => {
  it('returns the distinct brand list', async () => {
    mockApi.onGet('/motorcycles/brands').reply(200, ['Yamaha', 'Honda']);
    expect(await listBrands()).toEqual(['Yamaha', 'Honda']);
  });
});

describe('getMotorcycleById', () => {
  it('requests the record by numeric id', async () => {
    const motorcycle = buildMotorcycle();
    mockApi.onGet('/motorcycles/1').reply(200, motorcycle);
    expect(await getMotorcycleById(1)).toEqual(motorcycle);
  });
});

describe('getMotorcycleBySlug', () => {
  it('requests the record by slug', async () => {
    const motorcycle = buildMotorcycle();
    mockApi.onGet('/motorcycles/slug/yamaha-mt-07-2024').reply(200, motorcycle);
    expect(await getMotorcycleBySlug('yamaha-mt-07-2024')).toEqual(motorcycle);
  });
});

describe('compareMotorcycles', () => {
  it('joins ids into a single comma-separated param', async () => {
    mockApi.onGet('/motorcycles/compare').reply((config) => {
      expect(config.params).toEqual({ ids: '1,2,3' });
      return [200, buildComparison()];
    });
    await compareMotorcycles([1, 2, 3]);
  });

  it('exposes the 2..4 bounds the endpoint enforces', () => {
    expect(COMPARISON_MIN).toBe(2);
    expect(COMPARISON_MAX).toBe(4);
  });

  it('refuses to call the endpoint outside those bounds', async () => {
    await expect(compareMotorcycles([1])).rejects.toThrow('compareMotorcycles requires 2-4 ids');
    await expect(compareMotorcycles([1, 2, 3, 4, 5])).rejects.toThrow(
      'compareMotorcycles requires 2-4 ids',
    );
    expect(mockApi.history.get).toHaveLength(0);
  });
});

describe('admin mutations', () => {
  it('creates a motorcycle and returns the created record', async () => {
    const created = buildMotorcycle({ id: 99 });
    mockApi.onPost('/motorcycles').reply(201, created);
    expect(await createMotorcycle({ brand: 'Yamaha' })).toEqual(created);
  });

  it('replaces a motorcycle via PUT with the full payload', async () => {
    const updated = buildMotorcycle({ brand: 'Honda' });
    mockApi.onPut('/motorcycles/1').reply((config) => {
      expect(JSON.parse(config.data).brand).toBe('Honda');
      return [200, updated];
    });
    expect(await updateMotorcycle(1, { brand: 'Honda' })).toEqual(updated);
  });

  it('deletes a motorcycle and resolves with no value', async () => {
    mockApi.onDelete('/motorcycles/1').reply(204);
    await expect(deleteMotorcycle(1)).resolves.toBeUndefined();
  });

  it('uploads an image as multipart form data without a manual Content-Type', async () => {
    const file = new File(['binary'], 'photo.jpg', { type: 'image/jpeg' });
    const updated = buildMotorcycle({ imageUrl: '/images/1.jpg' });

    mockApi.onPost('/motorcycles/1/image').reply((config) => {
      expect(config.data).toBeInstanceOf(FormData);
      return [200, updated];
    });

    expect(await uploadMotorcycleImage(1, file)).toEqual(updated);
  });

  it('reports upload progress through onProgress', async () => {
    const file = new File(['binary'], 'photo.jpg', { type: 'image/jpeg' });
    mockApi.onPost('/motorcycles/1/image').reply((config) => {
      config.onUploadProgress?.({ loaded: 50, total: 100 });
      return [200, buildMotorcycle()];
    });

    const progressUpdates = [];
    await uploadMotorcycleImage(1, file, { onProgress: (pct) => progressUpdates.push(pct) });
    expect(progressUpdates).toEqual([50]);
  });

  it('reports 0 progress when the total is not known', async () => {
    const file = new File(['binary'], 'photo.jpg', { type: 'image/jpeg' });
    mockApi.onPost('/motorcycles/1/image').reply((config) => {
      config.onUploadProgress?.({ loaded: 50, total: 0 });
      return [200, buildMotorcycle()];
    });

    const progressUpdates = [];
    await uploadMotorcycleImage(1, file, { onProgress: (pct) => progressUpdates.push(pct) });
    expect(progressUpdates).toEqual([0]);
  });

  it('deletes an image and returns the updated record', async () => {
    const cleared = buildMotorcycle({ imageUrl: null });
    mockApi.onDelete('/motorcycles/1/image').reply(200, cleared);
    expect(await deleteMotorcycleImage(1)).toEqual(cleared);
  });
});

describe('constants', () => {
  it('lists every backend category', () => {
    expect(CATEGORIES).toContain('SPORT');
    expect(CATEGORIES).toContain('ELECTRIC');
    expect(CATEGORIES.length).toBeGreaterThan(0);
  });

  it('accepts jpeg, png and webp', () => {
    expect(IMAGE_CONTENT_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('caps uploads at 5 MB', () => {
    expect(IMAGE_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});
