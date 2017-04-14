(ns formious.views.blocks
  (:require [rum.core :as rum]))

(defn- getBlocksParameters
  [blocks]
  (disj (set (mapcat (comp keys :context) blocks)) "template"))

(rum/defc BlocksTree
  [blocks]
  (let [parameters (getBlocksParameters blocks)]
  ; whenever blocks change, we may need to update the parameters list
    [:div
     [:table.fill.padded.striped.grid.blocks
      [:thead
       [:tr
        [:th]
        [:th "block_id"]
        [:th "template/block params"]
        (for [parameter parameters]
          [:th parameter])
        [:th "view_order"]
        [:th]]]
      [:tbody
       (for [block (sort-by :view_order blocks)]
         [:tr {:class (when-not (:template_id block) "container")}
          [:td {:style {:padding-right "5px"}}
           [:input {:type "checkbox"
                    :ng-model "block.selected"}]]
          [:td
           [:span (or (:id block) "unsaved")]
           [:a {:ng-click "block.editing = !block.editing"}
            (if (:editing block) "View" "Edit")]]
          ; swap (template_id, context) / (randomize, children)
          ; stim-type blocks
          [:td {:ng-if "block.template_id"}
           [:a-template.nowrap {:ng-if "!block.editing"
                                :template-id "{block.template_id}"}]
           [:select-template {:ng-if "block.editing"
                              :model "block.template_id"}]]
          (for [parameter parameters]
            [:td {:ng-if "block.template_id && !block.editing"}
             [:span (get (:context block) parameter)]])
          [:td {:ng-if "block.template_id && block.editing"
                :colspan "{parameters.length}"}
           [:jsonarea {:ng-model "block.context"
                       :style {:width "100%" :height "100px" :font "8pt monospace"}}]]
          ; container-type blocks
          [:td {:ng-if "!block.template_id"
                :colspan "{parameters.length + 1}"
                :style {:padding 0}}
           [:div
            "Block:"
            [:label
             [:input {:type "checkbox"
                      :ng-model "block.randomize"}]
             "Randomize"]
            [:label [:b "Quota"] ": " [:input {:type "number"
                                               :ng-model "block.quota"}]]
            [:button {:ng-click "$emit('collapseBlock', block)"} "Collapse"]]
           [:div {:blocks "block.children"}]]
          ; the rest are common to both types of blocks
          [:td
           [:input {:ng-if "block.editing"
                    :type "number"
                    :ng-model "block.view_order"
                    :step "any"
                    :style {:width "50px"}}]
           [:span {:ng-if "!block.editing"} (:view_order block)]]
          [:td.nowrap
           [:a {:href "/experiments/{block.experiment_id}/blocks/{block.id}?workerId=testing"
                :target "_blank"}
            "Public"]
           [:button {:ng-click "$emit('deleteBlock', block)"} "Delete"]]])]]]))

(rum/defc BlocksTable
  []
  [:div
   [:section.hpad.box
    [:form.vform
     [:label.block
      [:div [:b "Default template"]]
      [:select {:ng-model "$storage.default_template_id"
                :ng-options "template.id as template.name for template in templates"}]]
     [:label.block
      [:div [:b "Import blocks from file"]]
      [:input {:type "file"
               :ng-upload "importFile($file)"}]]]]
   [:section.vpad.box
    [:div {:blocks "root.children"
           :checkbox-sequence true
           :style {:font-size "90%"}}]]
   [:nav.fixedflow {:style {:bottom 0 :border-top "1px solid #BBB" :padding "5px" :background-color "#EEE"}}
    [:ui-view
     [:button {:ng-click "deleteSelectedBlocks()"} "Delete selection"]
     [:button {:ng-click "groupSelectedBlocks()"} "Group selection"]
     [:button {:ng-click "saveTree()"} "Save tree"]
     [:button {:ng-click "addEmptyBlock()"} "Add empty block"]]]])

(rum/defc BlocksEdit
  []
  [:div
   [:form {:ng-submit "syncBlock($event)"}
    [:div {:style {:display "inline-block" :min-width "200px" :vertical-align "top"}}
     [:label
      [:div [:b "Parent Block ID"]]
      [:input {:type "number"
               :ng-model "block.parent_block_id"
               :disabled true}]]
     [:label
      [:div [:input {:type "checkbox"
                     :ng-model "block.randomize"}] [:b "Randomize"]]]
     [:label [:div [:b "Quota"]] [:input {:type "number"
                                          :ng-model "block.quota"}]]
     [:label [:div [:b "Template"]] [:select-template {:model "block.template_id"}]]
     [:label
      [:div [:b "View order"]]
      [:input {:type "number"
               :ng-model "block.view_order"
               :step "any"}]]
     [:p [:button "Save"]]]
    [:div {:style {:display "inline-block" :vertical-align "top"}}
     [:label
      [:div [:b "Context"]]
      [:jsonarea {:ng-model "block.context"
                  :style {:width "600px" :height "100px" :font "8pt monospace"}}]]]]])
