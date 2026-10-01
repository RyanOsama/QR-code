import { getDatabase } from '../connection';
import { CardTemplateItem } from '../../types';
import { INITIAL_DEFAULT_TEMPLATES } from '../../services/defaultTemplates';

export class CardTemplateRepository {
  /**
   * Initializes card_templates table and seeds defaults if empty.
   */
  static initTable(): void {
    const db = getDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS card_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'wedding',
        front_image TEXT NOT NULL,
        back_image TEXT,
        thumbnail_url TEXT,
        text_color_scheme TEXT DEFAULT 'gold',
        default_primary_color TEXT DEFAULT '#D4AF37',
        default_accent_color TEXT DEFAULT '#FFFFFF',
        default_qr_position TEXT DEFAULT 'right',
        is_active INTEGER NOT NULL DEFAULT 1,
        is_builtin INTEGER NOT NULL DEFAULT 0,
        company_id INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_card_templates_cat ON card_templates(category, is_active);
    `);

    // Check count and seed initial default templates if empty
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM card_templates`).get() as { count: number };
    if (countRow.count === 0) {
      this.seedDefaults();
    }
  }

  /**
   * Seeds the 12 default luxury templates.
   */
  static seedDefaults(): void {
    const db = getDatabase();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO card_templates (
        id, name, category, front_image, back_image, thumbnail_url,
        text_color_scheme, default_primary_color, default_accent_color,
        default_qr_position, is_active, is_builtin, company_id,
        created_at, updated_at
      ) VALUES (
        @id, @name, @category, @front_image, @back_image, @thumbnail_url,
        @text_color_scheme, @default_primary_color, @default_accent_color,
        @default_qr_position, @is_active, @is_builtin, @company_id,
        @created_at, @updated_at
      )
    `);

    const transaction = db.transaction((templates: typeof INITIAL_DEFAULT_TEMPLATES) => {
      for (const tpl of templates) {
        insertStmt.run({
          id: tpl.id,
          name: tpl.name,
          category: tpl.category,
          front_image: tpl.front_image,
          back_image: tpl.back_image || null,
          thumbnail_url: tpl.thumbnail_url || null,
          text_color_scheme: tpl.text_color_scheme || 'gold',
          default_primary_color: tpl.default_primary_color || '#D4AF37',
          default_accent_color: tpl.default_accent_color || '#FFFFFF',
          default_qr_position: tpl.default_qr_position || 'right',
          is_active: tpl.is_active ? 1 : 0,
          is_builtin: 1,
          company_id: null,
          created_at: now,
          updated_at: now,
        });
      }
    });

    transaction(INITIAL_DEFAULT_TEMPLATES);
  }

  /**
   * Lists all card templates with optional category / active filtering.
   */
  static getAll(filter?: { category?: string; companyId?: number | null; onlyActive?: boolean }): CardTemplateItem[] {
    const db = getDatabase();
    let query = `SELECT * FROM card_templates WHERE 1=1`;
    const params: any[] = [];

    if (filter?.category && filter.category !== 'all') {
      query += ` AND category = ?`;
      params.push(filter.category);
    }

    if (filter?.onlyActive) {
      query += ` AND is_active = 1`;
    }

    if (filter?.companyId !== undefined) {
      if (filter.companyId === null) {
        query += ` AND (company_id IS NULL)`;
      } else {
        query += ` AND (company_id IS NULL OR company_id = ?)`;
        params.push(filter.companyId);
      }
    }

    query += ` ORDER BY is_builtin DESC, created_at DESC`;

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(this.mapRowToItem);
  }

  /**
   * Retrieves single template by ID.
   */
  static getById(id: string): CardTemplateItem | null {
    const db = getDatabase();
    const row = db.prepare(`SELECT * FROM card_templates WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return this.mapRowToItem(row);
  }

  /**
   * Creates a new template.
   */
  static create(item: Omit<CardTemplateItem, 'created_at' | 'updated_at'>): CardTemplateItem {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = item.id || `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const stmt = db.prepare(`
      INSERT INTO card_templates (
        id, name, category, front_image, back_image, thumbnail_url,
        text_color_scheme, default_primary_color, default_accent_color,
        default_qr_position, is_active, is_builtin, company_id,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      id,
      item.name,
      item.category || 'wedding',
      item.front_image,
      item.back_image || null,
      item.thumbnail_url || null,
      item.text_color_scheme || 'gold',
      item.default_primary_color || '#D4AF37',
      item.default_accent_color || '#FFFFFF',
      item.default_qr_position || 'right',
      item.is_active ? 1 : 0,
      item.is_builtin ? 1 : 0,
      item.company_id || null,
      now,
      now
    );

    return this.getById(id)!;
  }

  /**
   * Updates an existing template.
   */
  static update(id: string, data: Partial<CardTemplateItem>): CardTemplateItem | null {
    const db = getDatabase();
    const existing = this.getById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category);
    }
    if (data.front_image !== undefined) {
      updates.push('front_image = ?');
      params.push(data.front_image);
    }
    if (data.back_image !== undefined) {
      updates.push('back_image = ?');
      params.push(data.back_image);
    }
    if (data.thumbnail_url !== undefined) {
      updates.push('thumbnail_url = ?');
      params.push(data.thumbnail_url);
    }
    if (data.text_color_scheme !== undefined) {
      updates.push('text_color_scheme = ?');
      params.push(data.text_color_scheme);
    }
    if (data.default_primary_color !== undefined) {
      updates.push('default_primary_color = ?');
      params.push(data.default_primary_color);
    }
    if (data.default_accent_color !== undefined) {
      updates.push('default_accent_color = ?');
      params.push(data.default_accent_color);
    }
    if (data.default_qr_position !== undefined) {
      updates.push('default_qr_position = ?');
      params.push(data.default_qr_position);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    params.push(id);
    db.prepare(`UPDATE card_templates SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    return this.getById(id);
  }

  /**
   * Toggles active / disabled status of a template.
   */
  static toggleActive(id: string, isActive: boolean): boolean {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = db.prepare(`UPDATE card_templates SET is_active = ?, updated_at = ? WHERE id = ?`).run(
      isActive ? 1 : 0,
      now,
      id
    );
    return result.changes > 0;
  }

  /**
   * Deletes a template.
   */
  static delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare(`DELETE FROM card_templates WHERE id = ?`).run(id);
    return result.changes > 0;
  }

  private static mapRowToItem(row: any): CardTemplateItem {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      front_image: row.front_image,
      back_image: row.back_image || null,
      thumbnail_url: row.thumbnail_url || null,
      text_color_scheme: row.text_color_scheme || 'gold',
      default_primary_color: row.default_primary_color || '#D4AF37',
      default_accent_color: row.default_accent_color || '#FFFFFF',
      default_qr_position: row.default_qr_position || 'right',
      is_active: Boolean(row.is_active),
      is_builtin: Boolean(row.is_builtin),
      company_id: row.company_id || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
