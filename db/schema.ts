import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('openboard_rooms', {
 id:text('id').primaryKey(), snapshot:text('snapshot').notNull(),
 revision:integer('revision').notNull(), credentials:text('credentials').notNull(),
 createdAt:integer('created_at').notNull(), updatedAt:integer('updated_at').notNull(),
});
export const projects=sqliteTable('table_projects',{
 id:text('id').primaryKey(),owner:text('owner').notNull(),snapshot:text('snapshot').notNull(),revision:integer('revision').notNull(),listed:integer('listed').notNull().default(0),featured:integer('featured').notNull().default(0),updatedAt:integer('updated_at').notNull(),
});
