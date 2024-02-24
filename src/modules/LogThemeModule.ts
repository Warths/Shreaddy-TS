import { Module } from "@modular/core";
import { Filter } from "src/modular/hooks";


@Module()
export class LogThemeModule {

    format(prefix: string, logFormat: string, suffix: string = '\x1b[0m') {
        return `${prefix}[${this.getTime()}] - ${logFormat}${suffix}`;
    }

    @Filter("log_file_name")
    logFileName(fileName: string) {
        return this.generateFileNameWithDate()
    }

    @Filter("log_info_format")
    logInfoFormat(logFormat: string): string {
        return this.format('\x1b[34m', logFormat)
    }

    @Filter("log_notice_format")
    logNoticeFormat(logFormat: string): string {
        return this.format('\x1b[33m', logFormat)
    }

    @Filter("log_warning_format")
    logWarningFormat(logFormat: string): string {
        return this.format('\x1b[1;31m', logFormat)
    }

    @Filter("log_discrete_format")
    logDiscreteFormat(logFormat: string): string {
        return this.format('\x1b[90m', logFormat)
    }

    @Filter("log_third_party_format")
    logThirdPartyFormat(logFormat: string): string {
        return this.format('\x1b[92m', logFormat)
    }
    
    @Filter("log_important_format")
    logImportantFormat(logFormat: string): string {
        return this.format('\x1b[1;3;36m', logFormat)
    }

    @Filter("log_file_info_format")
    @Filter("log_file_notice_format")
    @Filter("log_file_warning_format")
    @Filter("log_file_discrete_format")
    @Filter("log_file_third_party_format")
    @Filter("log_file_important_format")
    logFile(logFormat: string): string {
        return this.format('', logFormat, '')

    }

    getTime(): string {
        const now = new Date();
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0'); // JavaScript months are 0-based
        const year = now.getFullYear().toString().substr(-2);
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
        return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }

    generateFileNameWithDate(): string {
        const now: Date = new Date();

        const year: number = now.getFullYear();
        const month: number = now.getMonth() + 1;
        const day: number = now.getDate();
        const formattedDate: string = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

        const monthsInFullLetter: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthInFullLetter: string = monthsInFullLetter[month - 1];
        const fileName: string = `${formattedDate}_${monthInFullLetter}_${year}`.replace(/[\s\/\\?%*:|"<>]/g, '_');
    
        return fileName;
    }


}