import prisma from "@/lib/prisma";

export const announcementService = {
    async getAnnouncements(visibleOnly: boolean = true) {
        const now = new Date();

        return await prisma.announcement.findMany({
            where: {
                ...(visibleOnly ? { visible: true } : {}),
                // Only show announcements that are within their active date range
                OR: [
                    // No start date or start date is in the past
                    { startDate: null },
                    { startDate: { lte: now } }
                ],
                AND: [
                    {
                        OR: [
                            // No end date or end date is in the future
                            { endDate: null },
                            { endDate: { gte: now } }
                        ]
                    }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });
    },

    async createAnnouncement(data: {
        title: string;
        content: string;
        imageUrl?: string;
        showImage?: boolean;
        imagePosition?: string;
        startDate?: Date;
        endDate?: Date;
        authorId: string;
        visible?: boolean;
        type?: "INFO" | "URGENT" | "EVENT" | "MAINTENANCE" | "SUCCESS" | "WARNING" | "NEWSLETTER" | "CELEBRATION"
    }) {
        return await prisma.announcement.create({
            data: {
                title: data.title,
                content: data.content,
                imageUrl: data.imageUrl,
                showImage: data.showImage ?? true,
                imagePosition: data.imagePosition ?? "LEFT",
                startDate: data.startDate,
                endDate: data.endDate,
                authorId: data.authorId,
                visible: data.visible ?? true,
                type: data.type ?? "INFO"
            }
        });
    },

    async updateAnnouncement(id: string, data: {
        title?: string;
        content?: string;
        imageUrl?: string;
        showImage?: boolean;
        imagePosition?: string;
        startDate?: Date | null;
        endDate?: Date | null;
        visible?: boolean;
        type?: "INFO" | "URGENT" | "EVENT" | "MAINTENANCE" | "SUCCESS" | "WARNING" | "NEWSLETTER" | "CELEBRATION"
    }) {
        return await prisma.announcement.update({
            where: { id },
            data
        });
    },

    async deleteAnnouncement(id: string) {
        return await prisma.announcement.delete({
            where: { id }
        });
    }
};
