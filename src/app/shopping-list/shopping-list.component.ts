import { Component, OnInit, OnDestroy } from "@angular/core";

import { Ingredient } from "../shared/ingredient.model";
import { slService } from "./shopping-list.service";
import { Subscription } from "rxjs";
import { LoggingService } from "../logging.service";

@Component({
  selector: "app-shopping-list",
  templateUrl: "./shopping-list.component.html",
  styleUrls: ["./shopping-list.component.css"],
})
export class ShoppingListComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  ingredients: Ingredient[];

  constructor(
    private slService: slService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.ingredients = this.slService.getIngredients();
    this.subscription = this.slService.ingredientsChanged.subscribe(
      (ingredients: Ingredient[]) => {
        this.ingredients = ingredients;
      }
    );

    this.loggingService.printLog("Hello from ShoppingListComponent ngOnInit!");
  }

  onEditItem(index: number) {
    this.slService.startedEditing.next(index);
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
