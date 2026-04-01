import { CloudAccount, CloudRole, CloudEnvironment, CloudProvider, RoleHighlightStyle } from '../entrypoints/options/types';
import { AWSAccountSelectionHandler } from './account-selection-handlers/AWSAccountSelectionHandler';
import { AliyunAccountSelectionHandler } from './account-selection-handlers/AliyunAccountSelectionHandler';
import { GenericAccountSelectionHandler } from './account-selection-handlers/GenericAccountSelectionHandler';

/**
 * Base interface for account selection page handlers
 */
interface IAccountSelectionHandler {
    applyHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void;
    removeHighlighting(): void;
}

/**
 * AccountSelectionHighlighter - Main entry point
 * Routes to appropriate handler based on cloud provider type
 */
export class AccountSelectionHighlighter {
    private awsHandler: AWSAccountSelectionHandler;
    private aliyunHandler: AliyunAccountSelectionHandler;
    private genericHandler: GenericAccountSelectionHandler;
    private currentHandler: IAccountSelectionHandler | null = null;

    constructor() {
        this.awsHandler = new AWSAccountSelectionHandler();
        this.aliyunHandler = new AliyunAccountSelectionHandler();
        this.genericHandler = new GenericAccountSelectionHandler();
    }

    /**
     * Applies highlighting to account selection page.
     * Routes to the appropriate handler based on cloud provider.
     * 
     * @param environment The cloud environment configuration
     * @param accounts Array of cloud accounts to highlight
     */
    public applyHighlighting(environment: CloudEnvironment, accounts: CloudAccount[]): void {
        // Select appropriate handler based on provider
        if (environment.provider === CloudProvider.AWS_CN || 
            environment.provider === CloudProvider.AWS_GLOBAL) {
            this.currentHandler = this.awsHandler;
        } else if (environment.provider === CloudProvider.ALIYUN) {
            this.currentHandler = this.aliyunHandler;
        } else {
            // Use generic handler for custom providers or other cloud providers
            this.currentHandler = this.genericHandler;
        }

        this.currentHandler.applyHighlighting(environment, accounts);
    }

    /**
     * Removes all highlighting from the page.
     */
    public removeHighlighting(): void {
        // Remove from all handlers to be safe
        this.awsHandler.removeHighlighting();
        this.aliyunHandler.removeHighlighting();
        this.genericHandler.removeHighlighting();
        this.currentHandler = null;
    }
}
