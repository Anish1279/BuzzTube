import { integer, pgTable, varchar } from "drizzle-orm/pg-core";
export const usersTable = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),

});

export const AiThumbnailTable=pgTable('thumbnails',{
    id:integer().primaryKey().generatedAlwaysAsIdentity(),
    userInput:varchar(),
    thumbnailUrl:varchar(),
    refImage:varchar(),
    userEmail:varchar().references(()=>usersTable.email),
    createdOn:varchar()
})