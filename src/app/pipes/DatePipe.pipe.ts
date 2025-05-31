import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';

@Pipe({
    name: 'customDate',
    standalone: false
})
export class CustomDatePipe implements PipeTransform {

    transform(value: any): string {
        if (!value) return '';

        const now = new Date();
        const messageDate = new Date(value);

        // Same day: show time
        if (this.isSameDay(now, messageDate)) {
            return formatDate(value, 'h:mm a', 'en-US');
        }

        // Same week: show day of the week
        if (this.isSameWeek(now, messageDate)) {
            return formatDate(value, 'EEE', 'en-US'); // EEE is for abbreviated weekday (Mon, Tue, etc.)
        }

        // Same year: show month and date
        if (this.isSameYear(now, messageDate)) {
            return formatDate(value, 'MMM d', 'en-US'); // Jan 1
        }

        // Different year: show full date (month, date, year)
        return formatDate(value, 'MMM d, yyyy', 'en-US'); // Dec 27, 2024
    }

    private isSameDay(now: Date, messageDate: Date): boolean {
        return now.getDate() === messageDate.getDate() &&
            now.getMonth() === messageDate.getMonth() &&
            now.getFullYear() === messageDate.getFullYear();
    }

    private isSameWeek(now: Date, messageDate: Date): boolean {
        const startOfWeek = this.getStartOfWeek(now);
        const startOfMessageWeek = this.getStartOfWeek(messageDate);

        return startOfWeek.getTime() === startOfMessageWeek.getTime();
    }

    private isSameYear(now: Date, messageDate: Date): boolean {
        return now.getFullYear() === messageDate.getFullYear();
    }

    private getStartOfWeek(date: Date): Date {
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek == 0 ? -6 : 1); // Adjust for Sunday
        const startOfWeek = new Date(date.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0); // Normalize to midnight
        return startOfWeek;
    }
}
